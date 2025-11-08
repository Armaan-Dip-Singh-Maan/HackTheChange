import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { Link, router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    // TODO: replace with real auth logic
    console.log("Login:", { email, password });
    router.replace("/(tabs)"); // navigate to main app
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>

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

      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login
      </Button>

      <TouchableOpacity>
        <Link href="/signup" style={styles.link}>Don’t have an account? Sign up</Link>
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
