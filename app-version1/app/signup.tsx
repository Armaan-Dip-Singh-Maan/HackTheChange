import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { Link, router } from "expo-router";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSignup = async () => {
    if (password !== confirm) return alert("Passwords do not match!");
    console.log("Signup:", { email, password });
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        label="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        style={styles.input}
      />

      <Button mode="contained" onPress={handleSignup} style={styles.button}>
        Sign Up
      </Button>

      <TouchableOpacity>
        <Link href="/login" style={styles.link}>Already have an account? Login</Link>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { textAlign: "center", marginBottom: 24 },
  input: { marginBottom: 12 },
  button: { marginVertical: 12 },
  link: { textAlign: "center", color: "#007AFF", marginTop: 8 },
});
