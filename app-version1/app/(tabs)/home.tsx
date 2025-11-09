import React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Card } from "react-native-paper";

export default function HomeScreen() {
  return (
    <View style={styles.screen}>

      {/* Top Origin / Destination Inputs */}
      <View style={styles.topSearchBox}>
        <TextInput
          mode="outlined"
          placeholder="Origin"
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          placeholder="Destination"
          style={styles.input}
        />
      </View>

      {/* Map Placeholder */}
      <Card style={styles.mapPlaceholder}>
        <Card.Content>
          <View style={styles.mapBox} />
        </Card.Content>
      </Card>

      {/* Start Button */}
      <View style={styles.startButtonContainer}>
        <Button mode="contained" style={styles.startButton}>
          Start
        </Button>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  topSearchBox: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 10,
  },
  input: {
    backgroundColor: "white",
  },
  mapPlaceholder: {
    top: 25,
    marginTop: 130,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 3,
  },
  mapBox: {
    height: 400,
    backgroundColor: "#D3D3D3",
    borderRadius: 8,
  },
  startButtonContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
  },
  startButton: {
    paddingVertical: 6,
    borderRadius: 8,
  },
});
