import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FormInput from "../../components/FormInput";
import GlassCard from "../../components/GlassCard";
import PasswordInput from "../../components/PasswordInput";
import PrimaryButton from "../../components/PrimaryButton";
import { apiLogin } from "../../services/auth.service";
import { saveAuth } from "../../services/token.storage";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const onSignIn = async () => {
  try {
    if (!email.trim() || !password) {
      return Alert.alert("Missing", "Please enter email and password.");
    }

    const data = await apiLogin({
      email: email.trim(),
      password,
    });

    // data = { token, user }
    await saveAuth(data.token, data.user);

    router.replace("/home");
  } catch (e: any) {
    Alert.alert("Sign In Failed", e.message || "Try again.");
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>ReForm</Text>
      <Text style={styles.subTitle}>Sign in to continue</Text>

      <GlassCard>
        <FormInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />

        <PasswordInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
        />

        <PrimaryButton title="Sign In" onPress={onSignIn} />
      </GlassCard>

      <TouchableOpacity
        onPress={() => router.push("/signup")}
        style={styles.linkWrap}
      >
        <Text style={styles.linkText}>
          Don’t have an account? <Text style={styles.linkBlue}>Sign Up</Text>
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
    fontSize: 32,
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
