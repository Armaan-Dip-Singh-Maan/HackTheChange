import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Text, Card, Button, TextInput, IconButton } from "react-native-paper";
import Constants from "expo-constants";
import * as Location from "expo-location";
import Autocomplete from "react-native-autocomplete-input";
import MapRoute from "../../components/MapRoute";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { estimateCO2SavedPerRoute, EngineType, VehicleCategory } from "../../components/emissions";

type Coordinate = [number, number];

const ACCENT = "#16A34A";

export default function HomeScreen() {
  const isDark = useColorScheme() === "dark";

  const [origin, setOrigin] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);

  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);

  const [showMap, setShowMap] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>("Sedan");
  const [engineType, setEngineType] = useState<EngineType>("gas");

  const [lastRoutes, setLastRoutes] = useState<Array<{ index: number; distanceM: number; durationSec: number }>>([]);
  const [savedPerRoute, setSavedPerRoute] = useState<number[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);

  // NEW: control whether UI overlays (top inputs + bottom route box) are hidden
  const [uiHidden, setUiHidden] = useState(false);

  const fallbackLocation: Coordinate = [-114.0719, 51.0447];

  const MAPBOX_TOKEN =
    Constants.expoConfig?.extra?.MAPBOX_TOKEN ||
    process.env.EXPO_MAPBOX_PUBLIC_MAPBOX_TOKEN ||
    process.env.EXPO_MAPBOX_PUBLIC_TOKEN ||
    "";

  // Load user prefs from Firestore
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const ref = doc(db, "users", u.uid);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data() || {};
      if (d.vehicleCategory) setVehicleCategory(d.vehicleCategory as VehicleCategory);
      if (d.engineType) setEngineType(d.engineType as EngineType);
    });
  }, []);

  // When user returns to this screen for the first time: request location and show map centered on it
  useEffect(() => {
    if (!origin && !destination && !showMap) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") return;

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const coords: Coordinate = [location.coords.longitude, location.coords.latitude];
          setOrigin(coords);

          const placeName = await reverseGeocode(coords);
          setOriginText(placeName);

          setShowMap(true);
        } catch {
          // if anything fails, still show map with fallback origin
          setOrigin(fallbackLocation);
          setOriginText("Calgary, Alberta");
          setShowMap(true);
        }
      })();
    }
  }, [origin, destination, showMap]);

  // Recalculate CO2 per route when routes or vehicle prefs change
  useEffect(() => {
    if (!lastRoutes.length) return;
    const ordered = [...lastRoutes].sort((a, b) => a.index - b.index);
    const saved = estimateCO2SavedPerRoute(
      ordered.map((r) => ({
        distanceM: r.distanceM,
        durationSec: r.durationSec,
      })),
      vehicleCategory,
      engineType
    );
    setSavedPerRoute(saved);
  }, [lastRoutes, vehicleCategory, engineType]);

  const reverseGeocode = async ([lon, lat]: Coordinate) => {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.features?.[0]?.place_name ?? "Current Location";
    } catch {
      return "Current Location";
    }
  };

  // Use device current location, update origin and originText
  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is required.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: Coordinate = [location.coords.longitude, location.coords.latitude];
      setOrigin(coords);
      const name = await reverseGeocode(coords);
      setOriginText(name);
      // make sure map is visible and UI inputs are visible
      setShowMap(true);
      setUiHidden(false);
    } catch {
      setOrigin(fallbackLocation);
      setOriginText("Calgary, Alberta");
      setShowMap(true);
      setUiHidden(false);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Geocode textual address into coordinate
  const geocodeLocation = async (locationText: string): Promise<Coordinate | null> => {
    try {
      const encoded = encodeURIComponent(locationText.trim());
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.features?.[0]?.center ?? null;
    } catch {
      return null;
    }
  };

  // When user taps Update Route: geocode if needed, show map, and hide UI overlay (FAB appears)
  const handleFindRoute = async () => {
    Keyboard.dismiss();
    if (!MAPBOX_TOKEN) return Alert.alert("Error", "Mapbox token missing.");
    setGeocoding(true);
    try {
      let finalOrigin = origin;
      let finalDestination = destination;

      if (!finalOrigin && originText.trim()) {
        finalOrigin = await geocodeLocation(originText);
        if (finalOrigin) setOrigin(finalOrigin);
      }

      if (!finalDestination && destinationText.trim()) {
        finalDestination = await geocodeLocation(destinationText);
        if (finalDestination) setDestination(finalDestination);
      }

      if (!finalOrigin || !finalDestination) {
        Alert.alert("Missing Information", "Please enter both origin and destination.");
        return;
      }

      // Show the map and hide UI so user sees full map
      setShowMap(true);
      setUiHidden(true);
    } finally {
      setGeocoding(false);
    }
  };

  // Clear route: remove destination, clear related data, show top overlay again and center on origin
  const handleClearRoute = async () => {
    setDestination(null);
    setDestinationText("");
    setDestinationSuggestions([]);
    setLastRoutes([]);
    setSavedPerRoute([]);
    setSelectedRouteIdx(0);

    // Make sure UI comes back and map shows origin (if origin is null try to fetch it)
    setUiHidden(false);
    setShowMap(true);

    if (!origin) {
      // request current location if origin lost
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords: Coordinate = [location.coords.longitude, location.coords.latitude];
        setOrigin(coords);
        const name = await reverseGeocode(coords);
        setOriginText(name);
      } catch {
        setOrigin(fallbackLocation);
        setOriginText("Calgary, Alberta");
      }
    }
  };

  // Fetch suggestions helper for autocomplete
  const fetchSuggestions = async (text: string, setFn: Function) => {
    if (!text || text.length < 2) return setFn([]);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      text
    )}.json?autocomplete=true&types=place,address,poi&limit=5&access_token=${MAPBOX_TOKEN}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setFn(data.features || []);
    } catch {
      setFn([]);
    }
  };

  const onRoutesChange = (
    rs: Array<{ index: number; distanceM: number; durationSec: number }>
  ) => {
    setLastRoutes(rs);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}>
      {showMap && origin ? (
        <View style={styles.fullScreenMapContainer}>
          <MapRoute
            origin={origin}
            destination={destination || origin}
            // hide the route choice box when either there's no destination or the UI is explicitly hidden
            hideRouteBox={!destination || uiHidden}
            onRoutesChange={onRoutesChange}
            onRouteSelected={setSelectedRouteIdx}
            co2PerRoute={savedPerRoute}
          />

          {/* Top overlay inputs (hidden when uiHidden is true) */}
          {!uiHidden && (
            <View style={styles.topOverlay}>
              <View
                style={[
                  styles.inputOverlayContainer,
                  { backgroundColor: isDark ? "rgba(28,28,30,0.95)" : "rgba(255,255,255,0.95)" },
                ]}
              >
                {/* ORIGIN AUTOCOMPLETE */}
                <Autocomplete
                  data={originSuggestions}
                  value={originText}
                  onChangeText={(text) => {
                    setOriginText(text);
                    fetchSuggestions(text, setOriginSuggestions);
                  }}
                  flatListProps={{
                    keyExtractor: (item) => item.id,
                    style: { backgroundColor: isDark ? "#1c1c1e" : "#fff", borderRadius: 6 },
                    renderItem: ({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setOriginText(item.place_name);
                          setOrigin(item.center);
                          setOriginSuggestions([]);
                        }}
                        style={styles.suggestionItem}
                      >
                        <Text style={{ color: isDark ? "#fff" : "#000" }}>{item.place_name}</Text>
                      </TouchableOpacity>
                    ),
                  }}
                  inputContainerStyle={[
                    styles.overlayInput,
                    {
                      backgroundColor: isDark ? "#1c1c1e" : "#fff",
                      borderColor: isDark ? "#333" : "#ccc",
                      borderWidth: 1,
                    },
                  ]}
                  style={{
                    color: isDark ? "#fff" : "#000",
                    backgroundColor: isDark ? "#1c1c1e" : "#fff",
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                  }}
                  placeholder="Origin"
                  placeholderTextColor={isDark ? "#aaa" : "#666"}
                />

                {/* DESTINATION AUTOCOMPLETE */}
                <Autocomplete
                  data={destinationSuggestions}
                  value={destinationText}
                  onChangeText={(text) => {
                    setDestinationText(text);
                    fetchSuggestions(text, setDestinationSuggestions);
                  }}
                  flatListProps={{
                    keyExtractor: (item) => item.id,
                    style: { backgroundColor: isDark ? "#1c1c1e" : "#fff", borderRadius: 6 },
                    renderItem: ({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setDestinationText(item.place_name);
                          setDestination(item.center);
                          setDestinationSuggestions([]);
                        }}
                        style={styles.suggestionItem}
                      >
                        <Text style={{ color: isDark ? "#fff" : "#000" }}>{item.place_name}</Text>
                      </TouchableOpacity>
                    ),
                  }}
                  inputContainerStyle={[
                    styles.overlayInput,
                    {
                      backgroundColor: isDark ? "#1c1c1e" : "#fff",
                      borderColor: isDark ? "#333" : "#ccc",
                      borderWidth: 1,
                    },
                  ]}
                  style={{
                    color: isDark ? "#fff" : "#000",
                    backgroundColor: isDark ? "#1c1c1e" : "#fff",
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                  }}
                  placeholder="Destination"
                  placeholderTextColor={isDark ? "#aaa" : "#666"}
                />

                <View style={styles.overlayButtonRow}>
                  <Button
                    mode="contained"
                    onPress={() => {
                      handleFindRoute();
                    }}
                    style={styles.overlayButton}
                    loading={geocoding}
                    buttonColor={ACCENT}
                  >
                    {geocoding ? "Finding..." : "Update Route"}
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={handleClearRoute}
                    style={styles.overlayClearButton}
                  >
                    Clear
                  </Button>
                </View>

                <Button
                  mode="outlined"
                  onPress={handleUseCurrentLocation}
                  style={{ marginTop: 6 }}
                  icon="crosshairs-gps"
                >
                  Use Current Location
                </Button>
              </View>
            </View>
          )}

          {/* FAB to reveal UI when hidden */}
          {uiHidden && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setUiHidden(false)}
            >
              <IconButton icon="layers-outline" size={28} iconColor="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Initial card shown when map isn't ready; this now uses AUTOCOMPLETE controls so suggestions work before map is shown
        <View style={styles.initialContainer}>
          <Card style={[styles.initialCard, { backgroundColor: isDark ? "#1c1c1e" : "#fff" }]}>
            <Card.Title title="Plan Your Route" titleStyle={{ color: isDark ? "#fff" : "#000" }} />

            <Card.Content>
              <Autocomplete
                data={originSuggestions}
                value={originText}
                onChangeText={(text) => {
                  setOriginText(text);
                  fetchSuggestions(text, setOriginSuggestions);
                }}
                flatListProps={{
                  keyExtractor: (item) => item.id,
                  style: { backgroundColor: isDark ? "#1c1c1e" : "#fff", borderRadius: 6 },
                  renderItem: ({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setOriginText(item.place_name);
                        setOrigin(item.center);
                        setOriginSuggestions([]);
                      }}
                      style={styles.suggestionItem}
                    >
                      <Text style={{ color: isDark ? "#fff" : "#000" }}>{item.place_name}</Text>
                    </TouchableOpacity>
                  ),
                }}
                inputContainerStyle={[
                  styles.overlayInput,
                  {
                    backgroundColor: isDark ? "#1c1c1e" : "#fff",
                    borderColor: isDark ? "#333" : "#ccc",
                    borderWidth: 1,
                    marginBottom: 12,
                  },
                ]}
                style={{
                  color: isDark ? "#fff" : "#000",
                  backgroundColor: isDark ? "#1c1c1e" : "#fff",
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                }}
                placeholder="From"
                placeholderTextColor={isDark ? "#aaa" : "#666"}
              />

              <Autocomplete
                data={destinationSuggestions}
                value={destinationText}
                onChangeText={(text) => {
                  setDestinationText(text);
                  fetchSuggestions(text, setDestinationSuggestions);
                }}
                flatListProps={{
                  keyExtractor: (item) => item.id,
                  style: { backgroundColor: isDark ? "#1c1c1e" : "#fff", borderRadius: 6 },
                  renderItem: ({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setDestinationText(item.place_name);
                        setDestination(item.center);
                        setDestinationSuggestions([]);
                      }}
                      style={styles.suggestionItem}
                    >
                      <Text style={{ color: isDark ? "#fff" : "#000" }}>{item.place_name}</Text>
                    </TouchableOpacity>
                  ),
                }}
                inputContainerStyle={[
                  styles.overlayInput,
                  {
                    backgroundColor: isDark ? "#1c1c1e" : "#fff",
                    borderColor: isDark ? "#333" : "#ccc",
                    borderWidth: 1,
                    marginBottom: 12,
                  },
                ]}
                style={{
                  color: isDark ? "#fff" : "#000",
                  backgroundColor: isDark ? "#1c1c1e" : "#fff",
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                }}
                placeholder="To"
                placeholderTextColor={isDark ? "#aaa" : "#666"}
              />

              <Button
                mode="contained"
                onPress={() => {
                  handleFindRoute();
                }}
                style={styles.button}
                loading={geocoding}
                buttonColor={ACCENT}
              >
                Find Route
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullScreenMapContainer: { flex: 1, position: "relative" },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000 },
  inputOverlayContainer: { margin: 16, padding: 12, borderRadius: 12, elevation: 5 },
  overlayInput: { marginBottom: 8, borderRadius: 3 },
  overlayButtonRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  overlayButton: { flex: 1 },
  overlayClearButton: { flex: 1 },
  initialContainer: { flex: 1, justifyContent: "center", padding: 16 },
  initialCard: { marginBottom: 20 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: ACCENT,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
});
