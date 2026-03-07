import { BlurView } from "expo-blur";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export default function GlassCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.outer}>
      <BlurView intensity={25} tint="dark" style={styles.blur}>
        <View style={styles.inner}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(30,41,59,0.35)",
  },
  blur: {
    width: "100%",
  },
  inner: {
    padding: 16,
  },
});
