import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FormInput from "../../components/FormInput";
import GlassCard from "../../components/GlassCard";
import PasswordInput from "../../components/PasswordInput";
import PrimaryButton from "../../components/PrimaryButton";
import { apiSignup } from "../../services/auth.service";
import { saveAuth } from "../../services/token.storage";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const onCreate = async () => {
    try {
      if (!fullName.trim()) return Alert.alert("Missing", "Please enter your full name.");
      if (!email.trim()) return Alert.alert("Missing", "Please enter your email.");
      if (pw.length < 6) return Alert.alert("Weak password", "Use at least 6 characters.");
      if (pw !== confirmPw) return Alert.alert("Mismatch", "Passwords do not match.");

      const data = await apiSignup({
        fullName: fullName.trim(),
        email: email.trim(),
        password: pw,
      });

      await saveAuth(data.token, data.user);

      router.replace("/home");
    } catch (e: any) {
      Alert.alert("Sign Up Failed", e.message || "Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subTitle}>Join ReForm today</Text>

      <GlassCard>
        <FormInput
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name"
          autoCapitalize="words"
        />

        <FormInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />

        <PasswordInput
          label="Password"
          value={pw}
          onChangeText={setPw}
          placeholder="Create a password"
        />

        <PasswordInput
          label="Confirm Password"
          value={confirmPw}
          onChangeText={setConfirmPw}
          placeholder="Re-enter password"
        />

        <PrimaryButton title="Sign Up / Create Account" onPress={onCreate} />
      </GlassCard>

      <TouchableOpacity
        onPress={() => router.push("/signin")}
        style={styles.linkWrap}
      >
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkBlue}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#3B82F6",
    textAlign: "center",
  },
  subTitle: {
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 18,
    marginTop: 6,
  },
  linkWrap: { marginTop: 14, alignItems: "center" },
  linkText: { color: "#E5E7EB" },
  linkBlue: { color: "#3B82F6", fontWeight: "700" },
});
