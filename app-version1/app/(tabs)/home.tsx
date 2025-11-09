import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Chip } from 'react-native-paper';
import MapRoute from '../../components/MapRoute';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

type Coordinate = [number, number];

export default function HomeScreen() {
  const [origin, setOrigin] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  
  // Sample locations (Calgary, Alberta coordinates - verified working coordinates)
  const currentLocation: Coordinate = [-114.0719, 51.0447];
  
  const quickDestinations = [
    { name: 'Downtown Calgary', coord: [-114.0708, 51.0486] as Coordinate },
    { name: 'University of Calgary', coord: [-114.1294, 51.0775] as Coordinate },
    { name: 'Calgary Airport (Fixed)', coord: [-114.0207, 51.1225] as Coordinate }, // Corrected airport coordinates
    { name: 'Test Route (Short)', coord: [-114.0719, 51.0500] as Coordinate }, // Very close to origin for testing
  ];

  // Check if Mapbox token is available
  const EXPO_EXTRA = (Constants.expoConfig && Constants.expoConfig.extra) || {};
  const MAPBOX_TOKEN = EXPO_EXTRA.MAPBOX_TOKEN || process.env.EXPO_MAPBOX_PUBLIC_TOKEN || '';

  useEffect(() => {
    if (!MAPBOX_TOKEN && __DEV__) {
      console.warn('Mapbox token not found. Check your .env.local file.');
    }
  }, []);

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied', 
          'Location permission is required to use current location feature.'
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinate = [
        location.coords.longitude,
        location.coords.latitude,
      ];

      setOrigin(coords);
      setOriginText('Current Location');
      
      console.log('Got real GPS location:', coords);
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback to Calgary coordinates
      setOrigin(currentLocation);
      setOriginText('Current Location');
      Alert.alert('Location Error', 'Could not get current location, using Calgary as fallback.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleQuickDestination = (dest: { name: string; coord: Coordinate }) => {
    setDestination(dest.coord);
    setDestinationText(dest.name);
  };

  const handleFindRoute = async () => {
    if (!MAPBOX_TOKEN) {
      Alert.alert('Configuration Error', 'Mapbox token not configured. Check your .env.local file.');
      return;
    }

    setGeocoding(true);
    let finalOrigin = origin;
    let finalDestination = destination;

    try {
      // If origin is not set but we have text, try to geocode it
      if (!finalOrigin && originText.trim()) {
        console.log('Geocoding origin text:', originText);
        finalOrigin = await geocodeLocation(originText);
        if (finalOrigin) {
          setOrigin(finalOrigin);
          // Keep the original text without coordinates
          console.log('Geocoded origin to:', finalOrigin);
        }
      }

      // If destination is not set but we have text, try to geocode it
      if (!finalDestination && destinationText.trim()) {
        console.log('Geocoding destination text:', destinationText);
        finalDestination = await geocodeLocation(destinationText);
        if (finalDestination) {
          setDestination(finalDestination);
          // Keep the original text without coordinates
          console.log('Geocoded destination to:', finalDestination);
        }
      }

      // Check if we have both coordinates now
      if (!finalOrigin || !finalDestination) {
        Alert.alert(
          'Missing Location', 
          'Please set both origin and destination. You can:\n• Use the GPS button for current location\n• Select from quick destinations\n• Type an address (e.g., "1234 Main St, Calgary")\n\nMake sure addresses are detailed enough for geocoding.'
        );
        return;
      }
      
      // Log coordinates for debugging
      console.log('Finding route from origin:', finalOrigin, 'to destination:', finalDestination);
      console.log('Mapbox token available:', !!MAPBOX_TOKEN);
      
      setShowMap(true);
    } catch (error) {
      console.error('Error in handleFindRoute:', error);
      Alert.alert('Error', 'Could not process locations. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleClearRoute = () => {
    setShowMap(false);
    setOrigin(null);
    setDestination(null);
    setOriginText('');
    setDestinationText('');
  };

  const geocodeLocation = async (locationText: string): Promise<Coordinate | null> => {
    try {
      if (!MAPBOX_TOKEN) {
        throw new Error('Mapbox token not configured');
      }
      
      // Use Mapbox Geocoding API to convert address to coordinates
      const encodedLocation = encodeURIComponent(locationText.trim());
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
      
      console.log('Geocoding location:', locationText);
      console.log('Geocoding URL:', geocodeUrl);
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      console.log('Geocoding response:', data);
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].center;
        console.log('Found coordinates:', coordinates);
        return [coordinates[0], coordinates[1]] as Coordinate;
      } else {
        console.log('No coordinates found for:', locationText);
        return null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleOriginTextChange = async (text: string) => {
    setOriginText(text);
    
    // If user clears the text, clear the origin
    if (!text.trim()) {
      setOrigin(null);
      return;
    }
    
    // Try to geocode after user stops typing (debounce effect)
    // For now, we'll do it on blur or when they press find route
  };

  const handleDestinationTextChange = async (text: string) => {
    setDestinationText(text);
    
    // If user clears the text, clear the destination
    if (!text.trim()) {
      setDestination(null);
      return;
    }
  };



  return (
    <View style={styles.container}>
      {/* Warning only if token missing */}
      {!MAPBOX_TOKEN && (
        <View style={styles.warningBanner}>
          <Text variant="bodySmall" style={styles.warning}>
            ⚠️ Mapbox token not configured
          </Text>
        </View>
      )}

      {/* Full Screen Map with Overlays */}
      {showMap && origin && destination ? (
        <View style={styles.fullScreenMapContainer}>
          <MapRoute origin={origin} destination={destination} />
          
          {/* Top Overlay - Input Fields */}
          <View style={styles.topOverlay}>
            <View style={styles.inputOverlayContainer}>
              <TextInput
                label="From"
                value={originText}
                onChangeText={handleOriginTextChange}
                mode="outlined"
                style={styles.overlayInput}
                textColor="#000000"
                placeholder="Current location or address"
                dense
                right={
                  <TextInput.Icon
                    icon={loadingLocation ? "loading" : "crosshairs-gps"}
                    onPress={handleUseCurrentLocation}
                    disabled={loadingLocation}
                  />
                }
              />
              <TextInput
                label="To"
                value={destinationText}
                onChangeText={handleDestinationTextChange}
                mode="outlined"
                style={styles.overlayInput}
                textColor="#000000"
                placeholder="Enter destination"
                dense
              />
              <View style={styles.overlayButtonRow}>
                <Button
                  mode="contained"
                  onPress={handleFindRoute}
                  style={styles.overlayButton}
                  disabled={geocoding || !MAPBOX_TOKEN || (!origin && !originText.trim()) || (!destination && !destinationText.trim())}
                  loading={geocoding}
                  compact
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
        /* Initial Input Screen */
        <View style={styles.initialContainer}>
          <Card style={styles.initialCard}>
            <Card.Title 
              title="Plan Your Route" 
              left={(props) => <IconButton {...props} icon="map-marker-path" />} 
            />
            <Card.Content>
              <View style={styles.inputRow}>
                <TextInput
                  label="From (GPS, address, or coordinates)"
                  value={originText}
                  onChangeText={handleOriginTextChange}
                  mode="outlined"
                  style={styles.input}
                  textColor="#000000"
                  placeholder="e.g. 123 Main St, Calgary or use GPS"
                  right={
                    <TextInput.Icon
                      icon={loadingLocation ? "loading" : "crosshairs-gps"}
                      onPress={handleUseCurrentLocation}
                      disabled={loadingLocation}
                    />
                  }
                />
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  label="To (address, place name, or coordinates)"
                  value={destinationText}
                  onChangeText={handleDestinationTextChange}
                  mode="outlined"
                  style={styles.input}
                  textColor="#000000"
                  placeholder="e.g. Downtown Calgary, University of Calgary"
                />
              </View>

              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={handleFindRoute}
                  style={[styles.button, styles.findButton]}
                  disabled={geocoding || !MAPBOX_TOKEN || (!origin && !originText.trim()) || (!destination && !destinationText.trim())}
                  loading={geocoding}
                >
                  {geocoding ? 'Finding Locations...' : 'Find Route'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  warning: {
    color: '#ff9800',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'transparent',
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: '#333333',
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  findButton: {
    // Additional styling for find button if needed
  },
  clearButton: {
    // Additional styling for clear button if needed
  },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fullScreenMapContainer: {
    flex: 1,
    position: 'relative',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  inputOverlayContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  overlayInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  overlayButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  overlayButton: {
    flex: 1,
  },
  overlayClearButton: {
    flex: 1,
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  initialCard: {
    marginBottom: 20,
  },
  warningBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    padding: 12,
    zIndex: 2000,
  },


});
