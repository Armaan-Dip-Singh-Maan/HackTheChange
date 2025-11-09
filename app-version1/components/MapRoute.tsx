import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Platform, Text } from "react-native";
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
  const [route, setRoute] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
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
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      console.log('API URL:', url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', res.status, errorText);
        throw new Error(`API Error ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('API Response:', data);
      
      if (data.error) {
        throw new Error(`Mapbox API Error: ${data.error}`);
      }
      
      if (data.routes && data.routes.length > 0) {
        const routeGeometry = data.routes[0].geometry;
        
        // For native Mapbox (if available)
        setRoute({
          type: "Feature",
          geometry: routeGeometry,
        });
        
        // For react-native-maps fallback - convert coordinates
        const coords = routeGeometry.coordinates.map((coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(coords);
        
        console.log('Route loaded successfully with', coords.length, 'coordinates');
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

          {/* Route Line */}
          {route && (
            <MapboxGL.ShapeSource id="routeSource" shape={route}>
              <MapboxGL.LineLayer
                id="routeLine"
                style={{
                  lineColor: "#007AFF",
                  lineWidth: 4,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </MapboxGL.ShapeSource>
          )}
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

        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
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
});

export default MapRoute;
