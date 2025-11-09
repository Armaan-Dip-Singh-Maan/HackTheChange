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
      setOriginText(`Current Location (${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)})`);
      
      console.log('Got real GPS location:', coords);
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback to Calgary coordinates
      setOrigin(currentLocation);
      setOriginText('Current Location (Calgary - Fallback)');
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
          setOriginText(originText + ` (${finalOrigin[1].toFixed(4)}, ${finalOrigin[0].toFixed(4)})`);
          console.log('Geocoded origin to:', finalOrigin);
        }
      }

      // If destination is not set but we have text, try to geocode it
      if (!finalDestination && destinationText.trim()) {
        console.log('Geocoding destination text:', destinationText);
        finalDestination = await geocodeLocation(destinationText);
        if (finalDestination) {
          setDestination(finalDestination);
          setDestinationText(destinationText + ` (${finalDestination[1].toFixed(4)}, ${finalDestination[0].toFixed(4)})`);
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

  const testMapboxAPI = async () => {
    try {
      // Test with very simple, known working coordinates (New York to Philadelphia)
      const testOrigin = [-74.0059, 40.7128]; // NYC
      const testDestination = [-75.1652, 39.9526]; // Philadelphia
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${testOrigin[0]},${testOrigin[1]};${testDestination[0]},${testDestination[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      
      console.log('Testing Mapbox API with URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Test API Response:', data);
      
      if (data.routes && data.routes.length > 0) {
        Alert.alert('API Test Success', 'Mapbox API is working correctly!');
      } else {
        Alert.alert('API Test Failed', `No routes found. Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('API Test Error:', error);
      Alert.alert('API Test Error', `Error: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          🗺️ Navigation Demo
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Find routes using Mapbox Directions API
        </Text>
        {!MAPBOX_TOKEN && (
          <Text variant="bodySmall" style={styles.warning}>
            ⚠️ Mapbox token not configured
          </Text>
        )}
      </View>

      {/* Location Input Card */}
      <Card style={styles.card}>
        <Card.Title 
          title="Plan Your Route" 
          left={(props) => <IconButton {...props} icon="map-marker-path" />} 
        />
        <Card.Content>
          {/* Origin Input */}
          <View style={styles.inputRow}>
            <TextInput
              label="From (GPS, address, or coordinates)"
              value={originText}
              onChangeText={handleOriginTextChange}
              mode="outlined"
              style={styles.input}
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

          {/* Destination Input */}
          <View style={styles.inputRow}>
            <TextInput
              label="To (address, place name, or coordinates)"
              value={destinationText}
              onChangeText={handleDestinationTextChange}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. Downtown Calgary, University of Calgary"
            />
          </View>

          {/* Quick Destinations */}
          <Text variant="labelMedium" style={styles.sectionLabel}>
            Quick Destinations
          </Text>
          <View style={styles.chipContainer}>
            {quickDestinations.map((dest, idx) => (
              <Chip
                key={idx}
                onPress={() => handleQuickDestination(dest)}
                style={styles.chip}
                mode={destinationText === dest.name ? 'flat' : 'outlined'}
              >
                {dest.name}
              </Chip>
            ))}
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
            {showMap && (
              <Button
                mode="outlined"
                onPress={handleClearRoute}
                style={[styles.button, styles.clearButton]}
              >
                Clear
              </Button>
            )}
          </View>

          {/* Debug/Test Section */}
          {__DEV__ && (
            <View style={styles.debugSection}>
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={testMapboxAPI}
                  style={[styles.button, styles.testButton]}
                  disabled={!MAPBOX_TOKEN}
                >
                  Test API
                </Button>
                <Button
                  mode="outlined"
                  onPress={async () => {
                    if (originText.trim()) {
                      const result = await geocodeLocation(originText);
                      Alert.alert('Geocoding Test', result ? `Found: ${result[1].toFixed(4)}, ${result[0].toFixed(4)}` : 'No results found');
                    } else {
                      Alert.alert('Geocoding Test', 'Enter text in Origin field first');
                    }
                  }}
                  style={[styles.button, styles.testButton]}
                  disabled={!MAPBOX_TOKEN}
                >
                  Test Geocoding
                </Button>
              </View>
              <Text variant="bodySmall" style={styles.debugInfo}>
                Debug: Origin: {origin ? `[${origin[0].toFixed(4)}, ${origin[1].toFixed(4)}]` : 'Not set'}
              </Text>
              <Text variant="bodySmall" style={styles.debugInfo}>
                Debug: Destination: {destination ? `[${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}]` : 'Not set'}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Map Display */}
      {showMap && origin && destination && (
        <Card style={styles.card}>
          <Card.Title 
            title="Route Map" 
            left={(props) => <IconButton {...props} icon="map" />} 
          />
          <Card.Content>
            <View style={styles.mapContainer}>
              <MapRoute origin={origin} destination={destination} />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Info Card */}
      <Card style={styles.card}>
        <Card.Title 
          title="How to Use" 
          left={(props) => <IconButton {...props} icon="information" />} 
        />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.infoText}>
            1. Set your starting location using "Current Location" button
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            2. Choose a destination from quick options or enter manually
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            3. Tap "Find Route" to see directions on the map
          </Text>
          <Text variant="bodySmall" style={styles.noteText}>
            Note: This uses Mapbox Directions API for route calculation
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontWeight: '700',
    color: '#2d5016',
  },
  subtitle: {
    color: '#666',
    marginTop: 5,
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
    backgroundColor: '#fff',
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
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
  infoText: {
    marginBottom: 8,
    color: '#333',
  },
  noteText: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  debugSection: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  testButton: {
    marginTop: 8,
  },
  debugInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
});
