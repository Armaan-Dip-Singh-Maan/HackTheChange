import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Platform, Text, TouchableOpacity, useColorScheme } from "react-native";
import Constants from "expo-constants";
import MapView, { Marker, Polyline } from "react-native-maps";

const EXPO_EXTRA = (Constants.expoConfig && Constants.expoConfig.extra) || {};
const MAPBOX_TOKEN =
  (EXPO_EXTRA.MAPBOX_TOKEN as string | undefined) ||
  (process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string | undefined) ||
  "";

let MapboxGL: any = null;
if (Platform.OS !== "web") {
  try {
    const mb = require("@rnmapbox/maps");
    MapboxGL = mb && (mb.default || mb);
    if (MapboxGL && MAPBOX_TOKEN && typeof MapboxGL.setAccessToken === "function") {
      MapboxGL.setAccessToken(MAPBOX_TOKEN);
    }
  } catch {
    MapboxGL = null;
  }
}

type Coordinate = [number, number];

export interface MapRouteProps {
  origin: Coordinate;
  destination?: Coordinate | null;
  hideRouteBox?: boolean;
  onRoutesChange?: (routes: Array<{ index: number; distanceM: number; durationSec: number }>) => void;
  onRouteSelected?: (index: number) => void;
  co2PerRoute?: number[];
}

const MapRoute: React.FC<MapRouteProps> = ({
  origin,
  destination,
  hideRouteBox = false,
  onRoutesChange,
  onRouteSelected,
  co2PerRoute,
}) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const validateCoordinate = (coord: Coordinate) => {
    if (!Array.isArray(coord) || coord.length !== 2) return false;
    const [lng, lat] = coord;
    return typeof lng === "number" && typeof lat === "number" && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  };

  const sameCoord = (a: Coordinate, b: Coordinate) =>
    Array.isArray(a) && Array.isArray(b) && a.length === 2 && b.length === 2 && a[0] === b[0] && a[1] === b[1];

  useEffect(() => {
    if (origin && destination && !sameCoord(origin, destination)) fetchDirections(origin, destination);
    else {
      setRoutes([]);
      setLoading(false);
    }
  }, [origin, destination]);

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
        distanceM: r.distance,
        durationSec: Math.round(r.duration),
        mapboxFeature: { type: "Feature", geometry: r.geometry },
      }));
      setRoutes(processed);
      if (typeof onRoutesChange === "function") {
        onRoutesChange(
          processed.map((p: any) => ({
            index: p.index,
            distanceM: p.distanceM,
            durationSec: p.durationSec,
          }))
        );
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch directions");
    } finally {
      setLoading(false);
    }
  };

  if (!origin) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Set your starting point</Text>
      </View>
    );
  }

  if (!destination) {
    if (MapboxGL && Platform.OS !== "web") {
      return (
        <View style={styles.container}>
          <MapboxGL.MapView style={styles.map} styleURL="mapbox://styles/mapbox/streets-v12">
            <MapboxGL.Camera zoomLevel={12} centerCoordinate={origin} animationMode="flyTo" animationDuration={800} />
            <MapboxGL.PointAnnotation id="origin" coordinate={origin}>
              <View style={styles.annotationContainer}>
                <View style={styles.annotationFill} />
              </View>
            </MapboxGL.PointAnnotation>
          </MapboxGL.MapView>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: origin[1],
            longitude: origin[0],
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          <Marker coordinate={{ latitude: origin[1], longitude: origin[0] }} title="Origin" pinColor="green" />
        </MapView>
      </View>
    );
  }

  const bestSaved =
    co2PerRoute && co2PerRoute.length > 0 ? Math.max(...co2PerRoute.filter((n) => typeof n === "number")) : undefined;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubtext}>
          {!MAPBOX_TOKEN ? "Mapbox token not configured" : "Check your internet connection"}
        </Text>
      </View>
    );
  }

  if (MapboxGL && Platform.OS !== "web") {
    return (
      <View style={styles.container}>
        <MapboxGL.MapView style={styles.map} styleURL="mapbox://styles/mapbox/streets-v12">
          <MapboxGL.Camera zoomLevel={12} centerCoordinate={origin} animationMode="flyTo" animationDuration={1000} />
          <MapboxGL.PointAnnotation id="origin" coordinate={origin}>
            <View style={styles.annotationContainer}>
              <View style={styles.annotationFill} />
            </View>
          </MapboxGL.PointAnnotation>
          <MapboxGL.PointAnnotation id="destination" coordinate={destination}>
            <View style={styles.annotationContainer}>
              <View style={[styles.annotationFill, { backgroundColor: "#FF3B30" }]} />
            </View>
          </MapboxGL.PointAnnotation>
          {routes.map((r, i) => (
            <MapboxGL.ShapeSource key={`route-${i}`} id={`routeSource${i}`} shape={r.mapboxFeature}>
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
        <Marker coordinate={{ latitude: origin[1], longitude: origin[0] }} title="Origin" pinColor="green" />
        <Marker coordinate={{ latitude: destination[1], longitude: destination[0] }} title="Destination" pinColor="red" />
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

      {!hideRouteBox && routes.length > 0 && (
        <View
          style={[
            styles.routeSelectionContainer,
            { backgroundColor: isDark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)" },
          ]}
        >
          <Text style={[styles.routeSelectionTitle, { color: isDark ? "#fff" : "#333" }]}>Choose Your Route:</Text>

          {routes.map((r, i) => (
            <TouchableOpacity
              key={`route-option-${i}`}
              style={[styles.routeOption, i === selectedRouteIndex && styles.selectedRouteOption]}
              onPress={() => {
                setSelectedRouteIndex(i);
                if (typeof onRouteSelected === "function") onRouteSelected(i);
              }}
            >
              <View style={{ flexDirection: "column" }}>
                <Text
                  style={[
                    styles.routeTitle,
                    i === selectedRouteIndex && styles.selectedRouteTitle,
                    { color: isDark ? "#ddd" : "#333", marginBottom: 2 },
                  ]}
                >
                  {i === 0 ? "Fastest" : "Alternative"}
                </Text>

                <Text
                  style={[
                    {
                      color: isDark ? "#666" : "#444",
                      fontSize: 14,
                      fontWeight: "600",
                    },
                    bestSaved !== undefined &&
                      co2PerRoute?.[i] === bestSaved &&
                      styles.co2InlineGreen,
                  ]}
                >
                  {typeof co2PerRoute?.[i] === "number" && co2PerRoute?.[i] > 0
                    ? `${co2PerRoute?.[i].toFixed(3)} kg CO₂ saved • ${r.distanceKm} km • ${r.durationMin} min`
                    : `${r.distanceKm} km • ${r.durationMin} min`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
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
  annotationContainer: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  annotationFill: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#007AFF" },
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
  routeOption: { padding: 12, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: "transparent" },
  selectedRouteOption: { backgroundColor: "rgba(0,122,255,0.1)", borderColor: "#007AFF" },
  routeTitle: { fontSize: 14, fontWeight: "600" },
  selectedRouteTitle: { color: "#007AFF" },
  co2InlineGreen: { color: "#16A34A" },
});

export default MapRoute;
