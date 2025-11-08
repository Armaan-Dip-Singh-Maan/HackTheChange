import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput as PaperInput, Button, IconButton } from "react-native-paper";
import { Link, router } from "expo-router";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignup = () => {
    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }
    router.replace("/(tabs)/profile");
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

        <Button mode="contained" onPress={handleSignup} style={styles.button}>
          Sign Up
        </Button>

        <TouchableOpacity>
          <Link href="/login" style={styles.link}>
            Already have an account? <Text style={{ fontWeight: "600" }}>Login</Text>
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
    backgroundColor: "#F5F5F7", // light grey background
  },
  card: {
    backgroundColor: "white",
    padding: 28,
    borderRadius: 16,
    elevation: 4, // shadow Android
    shadowColor: "#000", // shadow iOS
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
