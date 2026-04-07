import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth-context";

const BG = "#050508";
const LIME = "#BEF264";
const CARD = "#141416";
const BORDER = "#26262C";
const MUTED = "#8C8C96";
const LABEL = "#A1A1AA";
const WHITE = "#FAFAFA";
const INPUT_BG = "#0C0C0E";
const ERROR_BG = "rgba(239, 68, 68, 0.12)";
const ERROR_BORDER = "rgba(239, 68, 68, 0.35)";
const ERROR_TEXT = "#FCA5A5";

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { signIn } = useAuth();

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await signIn(email, password, "student");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to sign in"
      );
      console.log(err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 24}
      style={styles.keyboardRoot}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            justifyContent: isKeyboardVisible ? "flex-start" : "center",
            paddingTop: isKeyboardVisible ? 24 : 0,
            paddingBottom: isKeyboardVisible ? 0 : 24,
          },
        ]}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.brand}>LUMINARY</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to your account to continue
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={MUTED}
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={MUTED}
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isSubmitting}
              onPress={handleSignIn}
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={BG} style={styles.spinner} />
              ) : null}
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  inner: {
    width: "100%",
  },
  header: {
    marginBottom: 40,
  },
  brand: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    color: LIME,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: WHITE,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: MUTED,
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: ERROR_BG,
    borderWidth: 1,
    borderColor: ERROR_BORDER,
  },
  errorText: {
    fontSize: 14,
    color: ERROR_TEXT,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: LABEL,
  },
  input: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: WHITE,
  },
  button: {
    width: "100%",
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: LIME,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  spinner: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: BG,
  },
});
