import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput as PaperInput, Button } from "react-native-paper";
import { Link, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const ACCENT = "#16A34A";
const BG = "#F5F7FF";
const CARD_BG = "#FFFFFF";
const OUTLINE = "#E5E7EB";
const TEXT = "#111827";
const LABEL = "#374151";
const PLACEHOLDER = "#9CA3AF";

const INPUT_THEME = {
  colors: {
    primary: ACCENT,
    outline: OUTLINE,
    onSurface: TEXT,
    onSurfaceVariant: LABEL,
    background: "transparent",
    placeholder: PLACEHOLDER,
  },
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ensureUserDoc = async (uid: string, emailAddr: string | null) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        email: emailAddr ?? "",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        vehicleCategory: "Sedan",
        engineType: "gas",
        lifetimeCO2Kg: 0,
        greenPoints: 0,
      });
    } else {
      await setDoc(
        ref,
        {
          lastLoginAt: serverTimestamp(),
          vehicleCategory: snap.data().vehicleCategory ?? "Sedan",
          engineType: snap.data().engineType ?? "gas",
          lifetimeCO2Kg:
            typeof snap.data().lifetimeCO2Kg === "number"
              ? snap.data().lifetimeCO2Kg
              : 0,
          greenPoints:
            typeof snap.data().greenPoints === "number"
              ? snap.data().greenPoints
              : 0,
        },
        { merge: true }
      );
    }
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user.uid, cred.user.email);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError("Invalid credentials or network error. Please try again.");
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
          Welcome Back
        </Text>

        <PaperInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          mode="outlined"
          theme={INPUT_THEME}
          style={styles.input}
          contentStyle={styles.inputContent}
          outlineColor={OUTLINE}
          activeOutlineColor={ACCENT}
          selectionColor={ACCENT}
        />

        <PaperInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCorrect={false}
          spellCheck={false}
          autoComplete="password"
          textContentType="password"
          mode="outlined"
          theme={INPUT_THEME}
          style={styles.input}
          contentStyle={styles.inputContent}
          outlineColor={OUTLINE}
          activeOutlineColor={ACCENT}
          selectionColor={ACCENT}
          right={
            <PaperInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword((prev) => !prev)}
              forceTextInputFocus={false}
            />
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          buttonColor={ACCENT}
          textColor="#FFFFFF"
        >
          Login
        </Button>

        <TouchableOpacity activeOpacity={0.7}>
          <Link href="/signup" style={styles.link}>
            Don&apos;t have an account? <Text style={styles.linkStrong}>Sign up</Text>
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
    backgroundColor: BG,
  },
  card: {
    backgroundColor: CARD_BG,
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: OUTLINE,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: TEXT,
  },
  input: {
    marginBottom: 14,
    backgroundColor: "#FCFCFD",
  },
  inputContent: {
    backgroundColor: "transparent",
    paddingVertical: 12,
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 8,
    fontSize: 13,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  link: {
    textAlign: "center",
    color: "#065F46",
    marginTop: 18,
    fontSize: 14,
  },
  linkStrong: {
    fontWeight: "700",
    color: "#065F46",
  },
});