import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput as PaperInput, Button } from "react-native-paper";
import { Link, router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    console.log("Login:", { email, password });
    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.card}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome Back
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

        <Button mode="contained" onPress={handleLogin} style={styles.button}>
          Login
        </Button>

        <TouchableOpacity>
          <Link href="/signup" style={styles.link}>
            Don&apos;t have an account? <Text style={{ fontWeight: "600" }}>Sign up</Text>
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
  button: {
    marginTop: 16,
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
