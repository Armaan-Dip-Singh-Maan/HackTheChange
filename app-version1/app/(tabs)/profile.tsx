import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, useColorScheme } from "react-native";
import {
  Avatar,
  Text,
  Button,
  Card,
  ProgressBar,
  List,
  Menu,
  Divider,
} from "react-native-paper";
import { router } from "expo-router";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

type EngineType = "gas" | "diesel" | "hybrid" | "ev";
type VehicleCategory = "Pickup Truck" | "SUV" | "Sedan";

const ACCENT = "#16A34A";
const ACCENT_DARK = "#15803D";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const BG = isDark ? "#0D0D0D" : "#F5F5F7";
  const CARD_BG = isDark ? "#1F2923" : "#FFFFFF";
  const TEXT = isDark ? "#FFFFFF" : "#111827";
  const SUBTEXT = isDark ? "#A1A1AA" : "#6B6B6B";
  const BORDER = isDark ? "#2E2E2E" : "#E5E7EB";

  const [displayName, setDisplayName] = useState("User");
  const [email, setEmail] = useState<string>("");
  const [vehicleCategory, setVehicleCategory] =
    useState<VehicleCategory>("Sedan");
  const [engineType, setEngineType] = useState<EngineType>("gas");
  const [lifetimeCO2Kg, setLifetimeCO2Kg] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const [catMenuVisible, setCatMenuVisible] = useState(false);
  const [engMenuVisible, setEngMenuVisible] = useState(false);

  const points = useMemo(() => lifetimeCO2Kg * 3, [lifetimeCO2Kg]);
  const goal = 500;

  useEffect(() => {
    const run = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }
      setDisplayName(user.displayName || "User");
      setEmail(user.email || "");
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email,
          createdAt: serverTimestamp(),
          vehicleCategory: "Sedan",
          engineType: "gas",
          lifetimeCO2Kg: 0,
          points: 0,
        });
        setVehicleCategory("Sedan");
        setEngineType("gas");
        setLifetimeCO2Kg(0);
      } else {
        const d = snap.data() || {};
        setVehicleCategory(
          (d.vehicleCategory as VehicleCategory) || "Sedan"
        );
        setEngineType((d.engineType as EngineType) || "gas");
        setLifetimeCO2Kg(
          typeof d.lifetimeCO2Kg === "number" ? d.lifetimeCO2Kg : 0
        );
      }
    };
    run().catch((e) => console.error(e));
  }, []);

  const handleSaveVehicle = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not signed in", "Please sign in again.");
      return;
    }
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", user.uid), {
        vehicleCategory,
        engineType,
      });
      Alert.alert("Saved", "Vehicle preferences updated.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save vehicle settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      router.replace("/login");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { backgroundColor: BG },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Icon
            size={80}
            icon="account"
            style={{ backgroundColor: ACCENT_DARK }}
            color="#fff"
          />
          <Text variant="headlineSmall" style={[styles.name, { color: TEXT }]}>
            {displayName}
          </Text>
          <Text variant="bodyMedium" style={[styles.email, { color: SUBTEXT }]}>
            {email}
          </Text>
        </View>

        {/* Points */}
        <Card
          style={[
            styles.card,
            { backgroundColor: CARD_BG, borderColor: BORDER },
          ]}
        >
          <Card.Title
            title="Green Points"
            titleStyle={{ color: TEXT }}
            left={(props) => (
              <List.Icon {...props} icon="leaf" color={ACCENT_DARK} />
            )}
          />
          <Card.Content>
            <Text
              variant="titleLarge"
              style={[styles.points, { color: TEXT }]}
            >
              {points.toFixed(3)} pts
            </Text>
            <ProgressBar
              progress={Math.min(points / goal, 1)}
              style={styles.progress}
              color={ACCENT}
              theme={{
                colors: {
                  primary: ACCENT,
                  surfaceVariant: isDark ? "#3c3c3cff" : "#E5E7EB",
                },
              }}
            />
            <Text variant="bodySmall" style={{ color: SUBTEXT }}>
              {(Math.max(goal - points, 0)).toFixed(3)} more points to next
              reward
            </Text>
            <Text
              variant="bodySmall"
              style={{ marginTop: 6, color: SUBTEXT }}
            >
              Lifetime CO₂ saved: {lifetimeCO2Kg.toFixed(3)} kg
            </Text>
          </Card.Content>
        </Card>

        {/* Vehicle Settings */}
        <Card
          style={[
            styles.card,
            { backgroundColor: CARD_BG, borderColor: BORDER },
          ]}
        >
          <Card.Title
            title="Vehicle Settings"
            titleStyle={{ color: TEXT }}
            left={(props) => (
              <List.Icon {...props} icon="car" color={ACCENT_DARK} />
            )}
          />
          <Card.Content>
            <View style={styles.row}>
              <Text style={[styles.label, { color: TEXT }]}>Category</Text>
              <Menu
                visible={catMenuVisible}
                onDismiss={() => setCatMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    textColor={ACCENT_DARK}
                    onPress={() => setCatMenuVisible(true)}
                  >
                    {vehicleCategory}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setVehicleCategory("Pickup Truck");
                    setCatMenuVisible(false);
                  }}
                  title="Pickup Truck"
                />
                <Menu.Item
                  onPress={() => {
                    setVehicleCategory("SUV");
                    setCatMenuVisible(false);
                  }}
                  title="SUV"
                />
                <Menu.Item
                  onPress={() => {
                    setVehicleCategory("Sedan");
                    setCatMenuVisible(false);
                  }}
                  title="Sedan"
                />
              </Menu>
            </View>

            <Divider style={{ marginVertical: 8, backgroundColor: BORDER }} />

            <View style={styles.row}>
              <Text style={[styles.label, { color: TEXT }]}>Engine</Text>
              <Menu
                visible={engMenuVisible}
                onDismiss={() => setEngMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    textColor={ACCENT_DARK}
                    onPress={() => setEngMenuVisible(true)}
                  >
                    {engineType.toUpperCase()}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setEngineType("gas");
                    setEngMenuVisible(false);
                  }}
                  title="Gas"
                />
                <Menu.Item
                  onPress={() => {
                    setEngineType("diesel");
                    setEngMenuVisible(false);
                  }}
                  title="Diesel"
                />
                <Menu.Item
                  onPress={() => {
                    setEngineType("hybrid");
                    setEngMenuVisible(false);
                  }}
                  title="Hybrid"
                />
                <Menu.Item
                  onPress={() => {
                    setEngineType("ev");
                    setEngMenuVisible(false);
                  }}
                  title="EV"
                />
              </Menu>
            </View>

            <Button
              mode="contained"
              onPress={handleSaveVehicle}
              style={styles.saveButton}
              buttonColor={ACCENT}
              textColor="#fff"
              loading={saving}
              disabled={saving}
            >
              Save Vehicle
            </Button>
          </Card.Content>
        </Card>

        {/* Logout */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={ACCENT_DARK}
          textColor="#fff"
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  screen: { flex: 1, padding: 20 },
  header: { alignItems: "center", marginBottom: 28 },
  name: { marginTop: 10, fontWeight: "600" },
  email: {},
  card: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  points: { fontWeight: "700", marginBottom: 6 },
  progress: { height: 6, borderRadius: 4, marginVertical: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  label: { fontWeight: "600" },
  saveButton: { marginTop: 12, borderRadius: 8, paddingVertical: 6 },
  logoutButton: { marginTop: 20, borderRadius: 8, paddingVertical: 6 },
});
