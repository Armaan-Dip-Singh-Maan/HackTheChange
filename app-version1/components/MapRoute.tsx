import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Platform, Text, TouchableOpacity } from "react-native";
import Constants from "expo-constants";
// Use react-native-maps as the primary map component (works in Expo Go and web)
import MapView, { Marker, Polyline } from 'react-native-maps';

// Support multiple ways the token might be provided
const EXPO_EXTRA = (Constants.expoConfig && Constants.expoConfig.extra) || {};
const MAPBOX_TOKEN = EXPO_EXTRA.MAPBOX_TOKEN || process.env.EXPO_MAPBOX_PUBLIC_TOKEN || "";

// Try to dynamically load Mapbox only on native platforms when available
let MapboxGL: any = null;
if (Platform.OS !== 'web') {
  try {
    // Only attempt to load @rnmapbox/maps on native platforms
    const mb = require('@rnmapbox/maps');
    MapboxGL = mb && (mb.default || mb);
    
    if (MapboxGL && MAPBOX_TOKEN && typeof MapboxGL.setAccessToken === 'function') {
      MapboxGL.setAccessToken(MAPBOX_TOKEN);
    }
  } catch (e) {
    // Failed to load native Mapbox (expected in Expo Go)
    MapboxGL = null;
    if (__DEV__) {
      console.warn('Native Mapbox not available, using react-native-maps fallback:', e);
    }
  }
}

type Coordinate = [number, number];

interface MapRouteProps {
  origin: Coordinate;
  destination: Coordinate;
}

const MapRoute: React.FC<MapRouteProps> = ({ origin, destination }) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (origin && destination) {
      fetchDirections(origin, destination);
    }
  }, [origin, destination]);

  const validateCoordinate = (coord: Coordinate): boolean => {
    if (!Array.isArray(coord) || coord.length !== 2) {
      return false;
    }
    const [lng, lat] = coord;
    return typeof lng === 'number' && typeof lat === 'number' && 
           lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  };

  const fetchDirections = async (from: Coordinate, to: Coordinate) => {
    setLoading(true);
    setError(null);
    try {
      if (!MAPBOX_TOKEN) {
        throw new Error('Mapbox token not configured');
      }
      
      // Validate coordinates
      if (!validateCoordinate(from)) {
        throw new Error(`Invalid origin coordinate: ${JSON.stringify(from)}`);
      }
      if (!validateCoordinate(to)) {
        throw new Error(`Invalid destination coordinate: ${JSON.stringify(to)}`);
      }
      
      // Log the coordinates and URL for debugging
      console.log('Fetching directions from:', from, 'to:', to);
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&alternatives=true&access_token=${MAPBOX_TOKEN}`;
      console.log('API URL:', url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', res.status, errorText);
        throw new Error(`API Error ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('API Response:', data);
      
      // Log detailed route information
      if (data.routes && data.routes.length > 0) {
        console.log('Route Details:');
        console.log('- Distance:', data.routes[0].distance, 'meters');
        console.log('- Duration:', data.routes[0].duration, 'seconds');
        console.log('- Weight:', data.routes[0].weight);
        console.log('- Geometry type:', data.routes[0].geometry?.type);
        console.log('- Coordinate count:', data.routes[0].geometry?.coordinates?.length);
        console.log('- Waypoints:', JSON.stringify(data.waypoints, null, 2));
        console.log('- Legs count:', data.routes[0].legs?.length);
        if (data.routes[0].legs?.length > 0) {
          console.log('- First leg:', JSON.stringify(data.routes[0].legs[0], null, 2));
        }
      }
      
      if (data.error) {
        throw new Error(`Mapbox API Error: ${data.error}`);
      }
      
      if (data.routes && data.routes.length > 0) {
        // Process all available routes
        const processedRoutes = data.routes.map((route: any, index: number) => {
          const coords = route.geometry.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          
          return {
            index,
            geometry: route.geometry,
            coordinates: coords,
            distance: route.distance,
            duration: route.duration,
            weight: route.weight,
            distanceKm: (route.distance / 1000).toFixed(1),
            durationMin: Math.round(route.duration / 60),
            mapboxFeature: {
              type: "Feature",
              geometry: route.geometry,
            }
          };
        });
        
        setRoutes(processedRoutes);
        
        console.log(`📍 Found ${processedRoutes.length} route(s):`);
        processedRoutes.forEach((route: any, idx: number) => {
          console.log(`Route ${idx + 1}: ${route.distanceKm} km, ${route.durationMin} min`);
        });
        
      } else {
        console.error('No routes in response:', data);
        throw new Error(`No routes found. API returned: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error("Error fetching directions:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch directions');
    } finally {
      setLoading(false);
    }
  };

  if (!origin || !destination) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Please set both origin and destination</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubtext}>
          {!MAPBOX_TOKEN ? 'Mapbox token not configured' : 'Check your internet connection'}
        </Text>
      </View>
    );
  }

  // Use native Mapbox if available, otherwise fall back to react-native-maps
  if (MapboxGL && Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <MapboxGL.MapView style={styles.map} styleURL="mapbox://styles/mapbox/streets-v12">
          <MapboxGL.Camera
            zoomLevel={12}
            centerCoordinate={origin}
            animationMode="flyTo"
            animationDuration={1000}
          />

          {/* Origin Marker */}
          <MapboxGL.PointAnnotation id="origin" coordinate={origin}>
            <View style={styles.annotationContainer}>
              <View style={styles.annotationFill} />
            </View>
          </MapboxGL.PointAnnotation>

          {/* Destination Marker */}
          <MapboxGL.PointAnnotation id="destination" coordinate={destination}>
            <View style={styles.annotationContainer}>
              <View style={[styles.annotationFill, { backgroundColor: "#FF3B30" }]} />
            </View>
          </MapboxGL.PointAnnotation>

          {/* Route Lines */}
          {routes.map((route, index) => (
            <MapboxGL.ShapeSource key={`route-${index}`} id={`routeSource${index}`} shape={route.mapboxFeature}>
              <MapboxGL.LineLayer
                id={`routeLine${index}`}
                style={{
                  lineColor: index === selectedRouteIndex ? "#007AFF" : "#999",
                  lineWidth: index === selectedRouteIndex ? 5 : 3,
                  lineCap: "round",
                  lineJoin: "round",
                  lineOpacity: index === selectedRouteIndex ? 1 : 0.6,
                }}
              />
            </MapboxGL.ShapeSource>
          ))}
        </MapboxGL.MapView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </View>
    );
  }

  // Fallback to react-native-maps (works in Expo Go and web)
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: origin[1],
          longitude: origin[0],
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Origin Marker */}
        <Marker
          coordinate={{ latitude: origin[1], longitude: origin[0] }}
          title="Origin"
          pinColor="green"
        />

        {/* Destination Marker */}
        <Marker
          coordinate={{ latitude: destination[1], longitude: destination[0] }}
          title="Destination"
          pinColor="red"
        />

        {/* Route Lines */}
        {routes.map((route, index) => (
          <Polyline
            key={`polyline-${index}`}
            coordinates={route.coordinates}
            strokeColor={index === selectedRouteIndex ? "#007AFF" : "#999"}
            strokeWidth={index === selectedRouteIndex ? 5 : 3}

          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      
      {/* Route Selection UI */}
      {routes.length > 0 && (
        <View style={styles.routeSelectionContainer}>
          <Text style={styles.routeSelectionTitle}>Choose Your Route:</Text>
          {routes.map((route, index) => (
            <TouchableOpacity
              key={`route-option-${index}`}
              style={[
                styles.routeOption,
                index === selectedRouteIndex && styles.selectedRouteOption
              ]}
              onPress={() => setSelectedRouteIndex(index)}
            >
              <View style={styles.routeHeader}>
                <Text style={[
                  styles.routeTitle,
                  index === selectedRouteIndex && styles.selectedRouteTitle
                ]}>
                  Route {index + 1}
                </Text>
                <View style={styles.routeDetails}>
                  <Text style={[
                    styles.routeDistance,
                    index === selectedRouteIndex && styles.selectedRouteText
                  ]}>
                    {route.distanceKm} km
                  </Text>
                  <Text style={[
                    styles.routeTime,
                    index === selectedRouteIndex && styles.selectedRouteText
                  ]}>
                    {route.durationMin} min
                  </Text>
                </View>
              </View>
              {index === 0 && (
                <Text style={styles.routeLabel}>Fastest</Text>
              )}
              {index === 1 && (
                <Text style={styles.routeLabel}>Alternative</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Platform indicator */}
      <View style={styles.platformIndicator}>
        <Text style={styles.platformText}>
          {MapboxGL ? 'Using Native Mapbox' : 'Using React Native Maps'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  annotationContainer: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  annotationFill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#007AFF",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  platformIndicator: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformText: {
    color: "#fff",
    fontSize: 12,
  },
  routeSelectionContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeSelectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  routeOption: {
    backgroundColor: "rgba(240,240,240,0.9)",
    padding: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedRouteOption: {
    backgroundColor: "rgba(0,122,255,0.1)",
    borderColor: "#007AFF",
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  selectedRouteTitle: {
    color: "#007AFF",
  },
  routeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeDistance: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  routeTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  selectedRouteText: {
    color: "#007AFF",
  },
  routeLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    fontStyle: "italic",
  },
});

export default MapRoute;
