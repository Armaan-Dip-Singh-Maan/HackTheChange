import { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, TextInput as PaperInput, Button } from "react-native-paper";
import { Link, router, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

const ACCENT = "#16A34A";
const BG = "#F5F7FA";
const CARD_BG = "#FFFFFF";
const OUTLINE = "#E5E7EB";
const TEXT = "#111827";
const LABEL = "#374151";

const INPUT_THEME = {
  colors: {
    primary: ACCENT,
    outline: OUTLINE,
    onSurface: TEXT,
    onSurfaceVariant: LABEL,
    background: "transparent",
  },
};

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigation = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !confirm) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // await setDoc(doc(db, "users", cred.user.uid), {
      //   email: cred.user.email,
      //   createdAt: serverTimestamp(),
      // });
      setLoading(false);
      navigation.replace("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Error creating account. Please try again.");
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
          label="Password"
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
              onPress={() => setShowPassword((p) => !p)}
              forceTextInputFocus={false}
            />
          }
        />

        <PaperInput
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showConfirm}
          autoCorrect={false}
          spellCheck={false}
          autoComplete="password-new"
          textContentType="newPassword"
          mode="outlined"
          theme={INPUT_THEME}
          style={styles.input}
          contentStyle={styles.inputContent}
          outlineColor={OUTLINE}
          activeOutlineColor={ACCENT}
          selectionColor={ACCENT}
          right={
            <PaperInput.Icon
              icon={showConfirm ? "eye-off" : "eye"}
              onPress={() => setShowConfirm((p) => !p)}
              forceTextInputFocus={false}
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
          buttonColor={ACCENT}
          textColor="#FFFFFF"
        >
          Sign Up
        </Button>

        <TouchableOpacity activeOpacity={0.7}>
          <Link href="/login" style={styles.link}>
            Already have an account? <Text style={styles.linkStrong}>Login</Text>
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
    fontWeight: "800",
    letterSpacing: 0.2,
    color: TEXT,
  },
  input: {
    marginBottom: 14,
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
    marginTop: 20,
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