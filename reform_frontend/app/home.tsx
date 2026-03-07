import { router } from "expo-router";
import { useMemo } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "../components/GlassCard";

type Exercise = {
  key: "barbell_curl" | "dumbbell_shoulder_press";
  title: string;
  subtitle: string;
  image: any;
};

export default function HomeDashboard() {
  const exercises = useMemo<Exercise[]>(
    () => [
      {
        key: "barbell_curl",
        title: "Barbell Curl",
        subtitle: "Biceps curl form check",
        image: require("../assets/exercises/barbell_curl.jpg"),
      },
      {
        key: "dumbbell_shoulder_press",
        title: "Dumbbell Shoulder Press",
        subtitle: "Shoulder press form check",
        image: require("../assets/exercises/dumbbell_shoulder_press.jpg"),
      }
    ],
    []
  );

  const goUpload = (exerciseKey: Exercise["key"]) => {
    router.push({
      pathname: "/upload",
      params: { exercise: exerciseKey },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Train Smarter</Text>
        <Text style={styles.heroSub}>
          Pick an exercise, upload a short video, and get instant feedback.
        </Text>
      </View>

      {/* Main Section */}
      <GlassCard>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <View style={styles.pill}>
            <Ionicons name="videocam-outline" size={14} color="#E5E7EB" />
            <Text style={styles.pillText}>Upload & Analyze</Text>
          </View>
        </View>

        <View style={styles.exListWrap}>
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.key}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => goUpload(item.key)}
                style={styles.exerciseCard}
              >
                <View style={styles.exerciseImageWrap}>
                  <Image source={item.image} style={styles.exerciseImage} />
                </View>

                <Text style={styles.exerciseTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.exerciseSub} numberOfLines={2}>
                  {item.subtitle}
                </Text>

                <View style={styles.startRow}>
                  <Text style={styles.startText}>Start</Text>
                  <Ionicons name="arrow-forward" size={16} color="#E5E7EB" />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </GlassCard>


      {/* Tip box */}
      <View style={styles.tipBox}>
        <View style={styles.tipHeader}>
          <Ionicons name="sparkles-outline" size={16} color="#3B82F6" />
          <Text style={styles.tipTitle}>Tip</Text>
        </View>

        <Text style={styles.tipText}>
          Record in good lighting and keep your full body visible for better
          accuracy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 20,
  },

  hero: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.14)",
    marginBottom: 14,
  },
  heroTitle: {
    color: "#E5E7EB",
    fontWeight: "900",
    fontSize: 18,
  },
  heroSub: {
    color: "#9CA3AF",
    marginTop: 6,
    lineHeight: 18,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#E5E7EB",
    fontWeight: "800",
    fontSize: 18,
  },
  exListWrap: {
    maxHeight: 400, 
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.22)",
  },
  pillText: {
    color: "#E5E7EB",
    fontWeight: "700",
    fontSize: 12,
  },

  exerciseCard: {
    flex: 1,
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
    marginBottom: 12,
  },
  exerciseImageWrap: {
    height: 110,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1E293B",
    marginBottom: 10,
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  exerciseTitle: {
    color: "#E5E7EB",
    fontWeight: "800",
    fontSize: 14,
  },
  exerciseSub: {
    color: "#9CA3AF",
    marginTop: 4,
    fontSize: 12,
    minHeight: 32,
  },
  startRow: {
    marginTop: 10,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  startText: {
    color: "#E5E7EB",
    fontWeight: "800",
  },

  tipBox: {
    marginTop: 14,
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.14)",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  tipTitle: {
    color: "#3B82F6",
    fontWeight: "900",
  },
  tipText: {
    color: "#E5E7EB",
    lineHeight: 18,
  },
});
