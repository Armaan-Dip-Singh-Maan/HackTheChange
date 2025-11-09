// components/MapScreen.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import Mapbox from "@rnmapbox/maps";

Mapbox.setAccessToken("pk.eyJ1Ijoiam9obm55b2giLCJhIjoiY2t2Z3M3Z3YyMGN1dzJwbzQ4bTViZ3o0biJ9.U6rX5xO6k0b8KXJzV0ZfQw");

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera zoomLevel={12} centerCoordinate={[-114.0719, 51.0447]} />
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, borderRadius: 8 },  // nice rounded corners
});
