import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Avatar, Text, Button, Card, ProgressBar, List } from "react-native-paper";
import { router } from "expo-router";

export default function ProfileScreen() {
  // Mock Data — will replace with real DB later
  const user = {
    name: "John Doe",
    email: "johndoe@example.com",
    greenPoints: 320,
    goal: 500,
    vehicle: {
      name: "Ford F-150",
      model: "F-150 XLT",
      year: "2022",
      category: "Truck",
    },
  };

  const handleLogout = () => {
    router.replace("/login");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.screen}>

        {/* User Header */}
        <View style={styles.header}>
          <Avatar.Icon size={80} icon="account" style={{ backgroundColor: "#6C47FF" }} />
          <Text variant="headlineSmall" style={styles.name}>
            {user.name}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {user.email}
          </Text>
        </View>

        {/* Green Points Card */}
        <Card style={styles.card}>
          <Card.Title title="Green Points" left={(props) => <List.Icon {...props} icon="leaf" />} />
          <Card.Content>
            <Text variant="titleLarge" style={styles.points}>
              {user.greenPoints} pts
            </Text>
            <ProgressBar progress={user.greenPoints / user.goal} style={styles.progress} />
            <Text variant="bodySmall">
              {user.goal - user.greenPoints} more points to next reward
            </Text>
          </Card.Content>
        </Card>

        {/* Vehicle Info Card */}
        <Card style={styles.card}>
          <Card.Title title="Vehicle Info" left={(props) => <List.Icon {...props} icon="car" />} />
          <Card.Content>
            <List.Item title="Vehicle" description={user.vehicle.name} />
            <List.Item title="Model" description={user.vehicle.model} />
            <List.Item title="Year" description={user.vehicle.year} />
            <List.Item title="Category" description={user.vehicle.category} />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}>
          Logout
        </Button>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F5F5F7",
  },
  screen: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  name: {
    marginTop: 10,
    fontWeight: "600",
  },
  email: {
    color: "#6B6B6B",
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  points: {
    fontWeight: "700",
    marginBottom: 6,
  },
  progress: {
    height: 6,
    borderRadius: 4,
    marginVertical: 8,
  },
  logoutButton: {
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 6,
  },
});
