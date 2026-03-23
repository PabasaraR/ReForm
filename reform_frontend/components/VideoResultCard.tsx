import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

type VideoItem = {
  id: string
  fileName: string
  exerciseName: string
  date: string
  label: "Correct" | "Incorrect"
  badRatio: number
  feedback: string
  originalFrames: any[]
  reconstructedFrames: any[]
}

export default function VideoResultCard({
  item,
  onWatch,
  onViewMotion,
}: {
  item: VideoItem
  onWatch: (id: string) => void
  onViewMotion: (item: VideoItem) => void
}) {
  const isCorrect = item.label === "Correct"

  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {item.exerciseName.replace(/_/g, " ").toUpperCase()}
            <Text style={styles.fileName} numberOfLines={1}>
              {"  "}({item.fileName})
            </Text>
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            isCorrect ? styles.badgeCorrect : styles.badgeIncorrect,
          ]}
        >
          <Text style={styles.badgeText}>{item.label}</Text>
        </View>
      </View>

      <Text style={styles.dateText}>{item.date}</Text>

      {typeof item.badRatio === "number" ? (
        <Text style={styles.metaText}>
          Bad ratio {(item.badRatio * 100).toFixed(1)}%
        </Text>
      ) : null}

      <Text style={styles.feedbackLabel}>Feedback</Text>
      <Text style={styles.feedbackText}>{item.feedback}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => onWatch(item.id)}
          style={[styles.actionBtn, styles.watchBtn]}
          activeOpacity={0.9}
        >
          <Text style={styles.actionText}>Watch Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onViewMotion(item)}
          style={[styles.actionBtn, styles.motionBtn]}
          activeOpacity={0.9}
        >
          <Text style={styles.actionText}>View Motion</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  exerciseName: {
    color: "#3B82F6",
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 2,
  },
  fileName: {
    color: "#CBD5E1",
    fontWeight: "600",
    fontSize: 12,
  },
  dateText: {
    color: "#9CA3AF",
    marginTop: 6,
    fontSize: 12,
  },
  metaText: {
    color: "#CBD5E1",
    marginTop: 6,
    fontSize: 12,
  },
  feedbackLabel: {
    color: "#3B82F6",
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
    fontSize: 12,
  },
  feedbackText: {
    color: "#E5E7EB",
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeCorrect: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
  },
  badgeIncorrect: {
    backgroundColor: "rgba(239,68,68,0.15)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
  },
  badgeText: {
    color: "#E5E7EB",
    fontWeight: "700",
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
  },
  watchBtn: {
    backgroundColor: "#1E293B",
    borderColor: "rgba(148,163,184,0.15)",
  },
  motionBtn: {
    backgroundColor: "rgba(59,130,246,0.16)",
    borderColor: "rgba(59,130,246,0.30)",
  },
  actionText: {
    color: "#E5E7EB",
    fontWeight: "800",
    textAlign: "center",
  },
})