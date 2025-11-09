import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import Autocomplete from 'react-native-autocomplete-input';
import MapRoute from '../../components/MapRoute';

type Coordinate = [number, number];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [origin, setOrigin] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const fallbackLocation: Coordinate = [-114.0719, 51.0447];

  const MAPBOX_TOKEN =
    Constants.expoConfig?.extra?.MAPBOX_TOKEN ||
    process.env.EXPO_MAPBOX_PUBLIC_TOKEN ||
    '';

  const quickCategories = [
    { name: 'Gas', icon: 'gas-station', query: 'gas station' },
    { name: 'EV', icon: 'car-electric', query: 'EV charging station' },
    { name: 'Food', icon: 'silverware-fork-knife', query: 'restaurant' },
    { name: 'Coffee', icon: 'coffee', query: 'cafe' },
  ];

  useEffect(() => {
    if (!MAPBOX_TOKEN && __DEV__) {
      console.warn('Mapbox token not found.');
    }
  }, []);

  useEffect(() => {
    if (!origin && !destination && !showMap) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords: Coordinate = [
            location.coords.longitude,
            location.coords.latitude,
          ];
          setOrigin(coords);
          const placeName = await reverseGeocode(coords);
          setOriginText(placeName);
          setShowMap(true);
        } catch (error) {
          console.error('Error auto-getting location:', error);
        }
      })();
    }
  }, [origin, destination, showMap]);

  const reverseGeocode = async ([lon, lat]: Coordinate) => {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features?.[0]) return data.features[0].place_name;
    } catch {
      /* ignore */
    }
    return 'Current Location';
  };

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: Coordinate = [
        location.coords.longitude,
        location.coords.latitude,
      ];
      setOrigin(coords);
      const name = await reverseGeocode(coords);
      setOriginText(name);
    } catch (error) {
      console.error('Error getting location:', error);
      setOrigin(fallbackLocation);
      setOriginText('Calgary, Alberta');
      Alert.alert('Location Error', 'Using fallback (Calgary).');
    } finally {
      setLoadingLocation(false);
    }
  };

  const geocodeLocation = async (locationText: string): Promise<Coordinate | null> => {
    try {
      const encoded = encodeURIComponent(locationText.trim());
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.features?.[0]?.center || null;
    } catch (error) {
      console.error('Geocode error:', error);
      return null;
    }
  };

  const handleFindRoute = async () => {
    Keyboard.dismiss();
    if (!MAPBOX_TOKEN) {
      Alert.alert('Error', 'Mapbox token missing.');
      return;
    }

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
        Alert.alert('Missing info', 'Please set both origin and destination.');
        return;
      }
      setShowMap(true);
    } catch (error) {
      console.error('Error finding route:', error);
    } finally {
      setGeocoding(false);
    }
  };

  const handleQuickCategory = async (category: string) => {
    if (!origin) return Alert.alert('Missing Location', 'Need current location first.');
    try {
      const [lon, lat] = origin;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        category
      )}.json?proximity=${lon},${lat}&types=poi&limit=1&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      const place = data.features?.[0];
      if (place) {
        setDestination(place.center);
        setDestinationText(place.text);
        setShowMap(true);
      } else {
        Alert.alert('No Results', `No ${category} found nearby.`);
      }
    } catch {
      Alert.alert('Error', 'Could not search nearby place.');
    }
  };

  const handleClearRoute = () => {
    setShowMap(false);
    setOrigin(null);
    setDestination(null);
    setOriginText('');
    setDestinationText('');
  };

  const fetchSuggestions = async (text: string, set: Function) => {
    if (text.length < 2) return set([]);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      text
    )}.json?autocomplete=true&types=place,address,poi&limit=5&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    set(data.features || []);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000' : '#fff' },
      ]}
    >
      {showMap && origin ? (
        <View style={styles.fullScreenMapContainer}>
          <MapRoute
            origin={origin}
            destination={destination || origin}
            hideRouteBox={!destination}
          />

          <View style={styles.topOverlay}>
            <View
              style={[
                styles.inputOverlayContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(35,35,35,0.9)'
                    : 'rgba(255,255,255,0.95)',
                },
              ]}
            >
              {/* FROM */}
              <Autocomplete
                data={originSuggestions}
                value={originText}
                onChangeText={(text) => {
                  setOriginText(text);
                  fetchSuggestions(text, setOriginSuggestions);
                }}
                flatListProps={{
                  keyExtractor: (item) => item.id,
                  renderItem: ({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setOriginText(item.place_name);
                        setOrigin(item.center);
                        setOriginSuggestions([]);
                      }}
                    >
                      <Text style={styles.suggestion}>{item.place_name}</Text>
                    </TouchableOpacity>
                  ),
                }}
                inputContainerStyle={[
                  styles.overlayInput,
                  {
                    backgroundColor: isDark
                      ? 'rgba(50,50,50,0.9)'
                      : 'rgba(255,255,255,0.9)',
                  },
                ]}
                placeholder="Current location or address"
              />

              {/* TO */}
              <Autocomplete
                data={destinationSuggestions}
                value={destinationText}
                onChangeText={(text) => {
                  setDestinationText(text);
                  fetchSuggestions(text, setDestinationSuggestions);
                }}
                flatListProps={{
                  keyExtractor: (item) => item.id,
                  renderItem: ({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setDestinationText(item.place_name);
                        setDestination(item.center);
                        setDestinationSuggestions([]);
                      }}
                    >
                      <Text style={styles.suggestion}>{item.place_name}</Text>
                    </TouchableOpacity>
                  ),
                }}
                inputContainerStyle={[
                  styles.overlayInput,
                  {
                    backgroundColor: isDark
                      ? 'rgba(50,50,50,0.9)'
                      : 'rgba(255,255,255,0.9)',
                  },
                ]}
                placeholder="Enter destination"
              />

              <View style={styles.overlayButtonRow}>
                <Button
                  mode="contained"
                  onPress={handleFindRoute}
                  style={styles.overlayButton}
                  loading={geocoding}
                >
                  {geocoding ? 'Finding...' : 'Update Route'}
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleClearRoute}
                  style={styles.overlayClearButton}
                  compact
                >
                  Clear
                </Button>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.initialContainer}>
          <Card
            style={[
              styles.initialCard,
              { backgroundColor: isDark ? '#1c1c1e' : '#fff' },
            ]}
          >
            <Card.Title
              title="Plan Your Route"
              titleStyle={{ color: isDark ? '#fff' : '#000' }}
              left={(props) => <IconButton {...props} icon="map-marker-path" />}
            />
            <Card.Content>
              <TextInput
                label="From (GPS or address)"
                value={originText}
                onChangeText={setOriginText}
                mode="outlined"
                style={styles.input}
                placeholder="Use GPS or enter address"
                right={
                  <TextInput.Icon
                    icon={loadingLocation ? 'loading' : 'crosshairs-gps'}
                    onPress={handleUseCurrentLocation}
                    disabled={loadingLocation}
                  />
                }
              />
              <TextInput
                label="To (address or place)"
                value={destinationText}
                onChangeText={setDestinationText}
                mode="outlined"
                style={styles.input}
                placeholder="Enter destination"
              />
              <View style={styles.quickIconRow}>
                {quickCategories.map((cat) => (
                  <Button
                    key={cat.name}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={cat.icon as any}
                        size={20}
                        color={isDark ? '#fff' : '#333'}
                      />
                    )}
                    mode="outlined"
                    compact
                    style={styles.quickButton}
                    onPress={() => handleQuickCategory(cat.query)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </View>
              <Button
                mode="contained"
                onPress={handleFindRoute}
                style={styles.button}
                loading={geocoding}
              >
                {geocoding ? 'Finding...' : 'Find Route'}
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
  fullScreenMapContainer: { flex: 1, position: 'relative' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 },
  inputOverlayContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    elevation: 5,
  },
  overlayInput: { marginBottom: 8 },
  overlayButtonRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  overlayButton: { flex: 1 },
  overlayClearButton: { flex: 1 },
  initialContainer: { flex: 1, justifyContent: 'center', padding: 16 },
  initialCard: { marginBottom: 20 },
  input: { marginBottom: 12 },
  quickIconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  quickButton: { flexGrow: 1, marginHorizontal: 4, marginVertical: 4 },
  button: { marginTop: 8 },
  suggestion: {
    padding: 8,
    fontSize: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
});
