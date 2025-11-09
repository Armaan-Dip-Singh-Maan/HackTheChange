import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Constants from "expo-constants";
import MapView, { Marker, Polyline } from "react-native-maps";

const EXPO_EXTRA = (Constants.expoConfig && Constants.expoConfig.extra) || {};
const MAPBOX_TOKEN =
  EXPO_EXTRA.MAPBOX_TOKEN || process.env.EXPO_MAPBOX_PUBLIC_TOKEN || "";

let MapboxGL: any = null;
if (Platform.OS !== "web") {
  try {
    const mb = require("@rnmapbox/maps");
    MapboxGL = mb && (mb.default || mb);
    if (MapboxGL && MAPBOX_TOKEN && typeof MapboxGL.setAccessToken === "function") {
      MapboxGL.setAccessToken(MAPBOX_TOKEN);
    }
  } catch (e) {
    MapboxGL = null;
    if (__DEV__) {
      console.warn("Native Mapbox not available, using react-native-maps fallback:", e);
    }
  }
}

type Coordinate = [number, number];

interface MapRouteProps {
  origin: Coordinate;
  destination: Coordinate;
  hideRouteBox?: boolean; // 👈 added optional prop
}

const MapRoute: React.FC<MapRouteProps> = ({
  origin,
  destination,
  hideRouteBox = false,
}) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (origin && destination) {
      fetchDirections(origin, destination);
    }
  }, [origin, destination]);

  const validateCoordinate = (coord: Coordinate): boolean => {
    if (!Array.isArray(coord) || coord.length !== 2) return false;
    const [lng, lat] = coord;
    return (
      typeof lng === "number" &&
      typeof lat === "number" &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    );
  };

  const fetchDirections = async (from: Coordinate, to: Coordinate) => {
    setLoading(true);
    setError(null);
    try {
      if (!MAPBOX_TOKEN) throw new Error("Mapbox token not configured");
      if (!validateCoordinate(from)) throw new Error(`Invalid origin: ${JSON.stringify(from)}`);
      if (!validateCoordinate(to)) throw new Error(`Invalid destination: ${JSON.stringify(to)}`);

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&alternatives=true&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.error) throw new Error(`Mapbox API Error: ${data.error}`);
      if (!data.routes?.length) throw new Error("No routes found");

      const processed = data.routes.map((r: any, i: number) => ({
        index: i,
        coordinates: r.geometry.coordinates.map((c: number[]) => ({
          latitude: c[1],
          longitude: c[0],
        })),
        distanceKm: (r.distance / 1000).toFixed(1),
        durationMin: Math.round(r.duration / 60),
        mapboxFeature: { type: "Feature", geometry: r.geometry },
      }));
      setRoutes(processed);
    } catch (err) {
      console.error("Error fetching directions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch directions");
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
          {!MAPBOX_TOKEN
            ? "Mapbox token not configured"
            : "Check your internet connection"}
        </Text>
      </View>
    );
  }

  // 🌎 Native Mapbox version (if available)
  if (MapboxGL && Platform.OS !== "web") {
    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL="mapbox://styles/mapbox/streets-v12"
        >
          <MapboxGL.Camera
            zoomLevel={12}
            centerCoordinate={origin}
            animationMode="flyTo"
            animationDuration={1000}
          />

          {/* Markers */}
          <MapboxGL.PointAnnotation id="origin" coordinate={origin}>
            <View style={styles.annotationContainer}>
              <View style={styles.annotationFill} />
            </View>
          </MapboxGL.PointAnnotation>
          <MapboxGL.PointAnnotation id="destination" coordinate={destination}>
            <View style={styles.annotationContainer}>
              <View
                style={[styles.annotationFill, { backgroundColor: "#FF3B30" }]}
              />
            </View>
          </MapboxGL.PointAnnotation>

          {/* Route Lines */}
          {routes.map((r, i) => (
            <MapboxGL.ShapeSource
              key={`route-${i}`}
              id={`routeSource${i}`}
              shape={r.mapboxFeature}
            >
              <MapboxGL.LineLayer
                id={`routeLine${i}`}
                style={{
                  lineColor: i === selectedRouteIndex ? "#007AFF" : "#999",
                  lineWidth: i === selectedRouteIndex ? 5 : 3,
                  lineCap: "round",
                  lineJoin: "round",
                  lineOpacity: i === selectedRouteIndex ? 1 : 0.6,
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

  // 🗺 Fallback to react-native-maps (Expo Go / Web)
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
        {/* Markers */}
        <Marker
          coordinate={{ latitude: origin[1], longitude: origin[0] }}
          title="Origin"
          pinColor="green"
        />
        <Marker
          coordinate={{ latitude: destination[1], longitude: destination[0] }}
          title="Destination"
          pinColor="red"
        />

        {/* Route Lines */}
        {routes.map((r, i) => (
          <Polyline
            key={`poly-${i}`}
            coordinates={r.coordinates}
            strokeColor={i === selectedRouteIndex ? "#007AFF" : "#999"}
            strokeWidth={i === selectedRouteIndex ? 5 : 3}
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* 🚫 Hide this block if hideRouteBox=true */}
      {!hideRouteBox && routes.length > 0 && (
        <View
          style={[
            styles.routeSelectionContainer,
            {
              backgroundColor: isDark
                ? "rgba(40,40,40,0.95)"
                : "rgba(255,255,255,0.95)",
            },
          ]}
        >
          <Text
            style={[
              styles.routeSelectionTitle,
              { color: isDark ? "#fff" : "#333" },
            ]}
          >
            Choose Your Route:
          </Text>
          {routes.map((r, i) => (
            <TouchableOpacity
              key={`route-option-${i}`}
              style={[
                styles.routeOption,
                i === selectedRouteIndex && styles.selectedRouteOption,
              ]}
              onPress={() => setSelectedRouteIndex(i)}
            >
              <View style={styles.routeHeader}>
                <Text
                  style={[
                    styles.routeTitle,
                    i === selectedRouteIndex && styles.selectedRouteTitle,
                    { color: isDark ? "#ddd" : "#333" },
                  ]}
                >
                  Route {i + 1}
                </Text>
                <View style={styles.routeDetails}>
                  <Text
                    style={[
                      styles.routeDistance,
                      i === selectedRouteIndex && styles.selectedRouteText,
                      { color: isDark ? "#aaa" : "#666" },
                    ]}
                  >
                    {r.distanceKm} km
                  </Text>
                  <Text
                    style={[
                      styles.routeTime,
                      i === selectedRouteIndex && styles.selectedRouteText,
                      { color: isDark ? "#aaa" : "#666" },
                    ]}
                  >
                    {r.durationMin} min
                  </Text>
                </View>
              </View>
              {i === 0 && (
                <Text style={[styles.routeLabel, { color: isDark ? "#999" : "#888" }]}>
                  Fastest
                </Text>
              )}
              {i === 1 && (
                <Text style={[styles.routeLabel, { color: isDark ? "#999" : "#888" }]}>
                  Alternative
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Platform indicator */}
      <View style={styles.platformIndicator}>
        <Text style={styles.platformText}>
          {MapboxGL ? "Using Native Mapbox" : "Using React Native Maps"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
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
  errorText: { fontSize: 16, color: "#FF3B30", textAlign: "center", marginBottom: 8 },
  errorSubtext: { fontSize: 14, color: "#666", textAlign: "center" },
  platformIndicator: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformText: { color: "#fff", fontSize: 12 },

  // Route UI
  routeSelectionContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  routeSelectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  routeOption: {
    backgroundColor: "rgba(240,240,240,0.9)",
    padding: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedRouteOption: { backgroundColor: "rgba(0,122,255,0.1)", borderColor: "#007AFF" },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeTitle: { fontSize: 14, fontWeight: "600" },
  selectedRouteTitle: { color: "#007AFF" },
  routeDetails: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeDistance: { fontSize: 14, fontWeight: "500" },
  routeTime: { fontSize: 14, fontWeight: "500" },
  selectedRouteText: { color: "#007AFF" },
  routeLabel: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
});

export default MapRoute;
