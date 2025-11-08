import { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput as PaperInput, Button } from "react-native-paper";
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig"; // adjust path if needed

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (password !== confirm) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 2. Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        totalCO2Saved: 0, // placeholder for your CO₂ tracking logic
      });

      console.log("✅ Account created successfully:", user.email);
      router.replace("/(tabs)/profile"); // or your home screen route
    } catch (err: any) {
    console.error("❌ Signup error:", err); // full object
    setError(err.message); // show real Firebase message
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.card}>
        <Text variant="headlineMedium" style={styles.title}>
          Create Account
        </Text>

        <PaperInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />

        <PaperInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          style={styles.input}
          right={
            <PaperInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword((prev) => !prev)}
            />
          }
        />

        <PaperInput
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showConfirm}
          mode="outlined"
          style={styles.input}
          right={
            <PaperInput.Icon
              icon={showConfirm ? "eye-off" : "eye"}
              onPress={() => setShowConfirm((prev) => !prev)}
            />
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleSignup}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Sign Up
        </Button>

        <TouchableOpacity>
          <Link href="/login" style={styles.link}>
            Already have an account?{" "}
            <Text style={{ fontWeight: "600" }}>Login</Text>
          </Link>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F5F5F7",
  },
  card: {
    backgroundColor: "white",
    padding: 28,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "600",
  },
  input: {
    marginBottom: 14,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    marginTop: 20,
    paddingVertical: 6,
    borderRadius: 8,
  },
  link: {
    textAlign: "center",
    color: "#6C47FF",
    marginTop: 18,
    fontSize: 14,
  },
});