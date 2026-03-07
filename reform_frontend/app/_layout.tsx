import { Stack, router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { clearAuth } from "../services/token.storage"; // adjust if needed

function HeaderTitle({ pageTitle }: { pageTitle: string }) {
  return (
    <View style={{ paddingLeft: 2 }}>
      <Text style={styles.brand} onPress={() => router.push("/home")}>ReForm</Text>
      <Text style={styles.pageTitle}>{pageTitle}</Text>
    </View>
  );
}

function HeaderRight() {
  const onLogout = async () => {
    await clearAuth();
    router.replace("/signin");
  };

  return (
    <View style={styles.headerRightRow}>
      <TouchableOpacity
        onPress={() => router.push("/user")}
        style={styles.iconBtn}
        hitSlop={10}
      >
        <Ionicons name="person-circle-outline" size={26} color="#E5E7EB" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onLogout} style={styles.iconBtn} hitSlop={10}>
        <Ionicons name="log-out-outline" size={24} color="#E5E7EB" />
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          // hide header everywhere by default
          headerShown: false,

          contentStyle: { backgroundColor: "#0F172A" },
          headerStyle: { backgroundColor: "#020617" },
          headerShadowVisible: false,
          headerTintColor: "#E5E7EB",
          headerTitleAlign: "left",
        }}
      >
        {/* Loading / Auth pages (header stays hidden because default is false) */}
        <Stack.Screen name="index" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />

        {/* ✅ ONLY these screens will show header */}
        <Stack.Screen
          name="home"
          options={{
            headerShown: true,
            headerTitle: () => <HeaderTitle pageTitle="Home" />,
            headerRight: () => <HeaderRight />,
          }}
        />

        <Stack.Screen
          name="upload"
          options={{
            headerShown: true,
            headerTitle: () => <HeaderTitle pageTitle="Upload" />,
            headerRight: () => <HeaderRight />,
          }}
        />

        <Stack.Screen
          name="user"
          options={{
            headerShown: true,
            headerTitle: () => <HeaderTitle pageTitle="User" />,
            headerRight: () => <HeaderRight />,
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F172A" },
  brand: { color: "#3B82F6", fontSize: 22, fontWeight: "900", lineHeight: 16 },
  pageTitle: {
    color: "#b5b8be",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 4,
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(148,163,184,0.10)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
});
