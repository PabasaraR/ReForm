import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VideoResultCard from "../components/VideoResultCard";
import VideoPlayerModal from "../components/VideoPlayerModal";
import { getMyHistory } from "../services/video.service";
import { getUser } from "../services/token.storage";
import FitnessTrainerPuppetSvg from "@/components/FitnessTrainerPuppetSvg";

type UploadItem = {
  id: string;
  fileName: string;
  date: string;
  label: "Correct" | "Incorrect";
  badRatio: number;
  feedback: string;
  exerciseName: string;
  originalFrames: any[];
  reconstructedFrames: any[];
};

function mapHistoryToUploadItem(v: any): UploadItem {
  const rawLabel = (v?.result?.label || "").toString().toLowerCase();
  const label =
    rawLabel === "correct" || rawLabel === "right" ? "Correct" : "Incorrect";

  const exerciseName =
    v.exercise === "barbell_curl"
      ? "Barbell Curl"
      : v.exercise === "dumbbell_shoulder_press"
        ? "Dumbbell Shoulder Press"
        : v.exercise || "Unknown Exercise";

  return {
    id: v._id,
    fileName: v.originalName || "video.mp4",
    date: new Date(v.createdAt).toLocaleString(),
    label,
    badRatio: typeof v?.result?.bad_ratio === "number" ? v.result.bad_ratio : 0,
    feedback: v?.result?.feedback || "No feedback available.",
    exerciseName,
    originalFrames: v?.result?.continuous_frames_before ?? [],
    reconstructedFrames: v?.result?.continuous_frames_after ?? [],
  };
}

export default function UserPage() {
  const [user, setUser] = useState<{ fullName?: string; email?: string }>({});
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const [motionOpen, setMotionOpen] = useState(false);
  const [selectedMotion, setSelectedMotion] = useState<any>(null);
  const [motionType, setMotionType] = useState("reconstructed");

  const loadUser = async () => {
    const storedUser = await getUser();
    setUser(storedUser || {});
  };

  const loadHistory = async () => {
    try {
      setError("");
      setLoading(true);

      const data = await getMyHistory();
      const items = Array.isArray(data?.items) ? data.items : [];
      // console.log("Fetched history items:", items[0].result.continuous_frames_after);
      setUploads(items.map(mapHistoryToUploadItem));
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const onWatch = (id: string) => {
    setSelectedVideoId(id);
    setPlayerOpen(true);
  };

  useEffect(() => {
    loadUser();
    loadHistory();
  }, []);

  const totalUploads = uploads.length;
  const incorrectCount = uploads.filter((x) => x.label === "Incorrect").length;
  const correctCount = uploads.filter((x) => x.label === "Correct").length;

  const initials = useMemo(() => {
    const name = (user.fullName || "User").trim();
    const parts = name.split(" ").filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [user.fullName]);

  const onViewMotion = (item: UploadItem) => {
    setSelectedMotion(item);
    setMotionOpen(true);
  };
  return (
    <View style={styles.container}>
      {/* Profile Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user.fullName || "User"}</Text>
          <Text style={styles.profileEmail}>{user.email || ""}</Text>

          {error ? (
            <Text style={styles.errorText} numberOfLines={2}>
              {error}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Ionicons name="cloud-upload-outline" size={16} color="#E5E7EB" />
            <Text style={styles.statLabel}>Uploads</Text>
          </View>
          <Text style={styles.statValue}>{totalUploads}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Ionicons name="close-circle-outline" size={16} color="#E5E7EB" />
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <Text style={styles.statValue}>{incorrectCount}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#E5E7EB" />
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <Text style={styles.statValue}>{correctCount}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={() => router.push("/home")}
          activeOpacity={0.9}
        >
          <Ionicons name="add-circle-outline" size={18} color="#E5E7EB" />
          <Text style={styles.actionText}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionSecondary]}
          onPress={loadHistory}
          activeOpacity={0.9}
        >
          <Ionicons name="refresh-outline" size={18} color="#E5E7EB" />
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Previous Uploads</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{totalUploads}</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={{ paddingTop: 20 }}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={uploads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VideoResultCard
              item={item}
              onWatch={onWatch}
              onViewMotion={onViewMotion}
            />
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="videocam-outline" size={22} color="#9CA3AF" />
              <Text style={styles.emptyText}>No uploads yet.</Text>
            </View>
          }
        />
      )}

      <VideoPlayerModal
        visible={playerOpen}
        videoDocId={selectedVideoId}
        onClose={() => {
          setPlayerOpen(false);
          setSelectedVideoId(null);
        }}
      />

      <Modal transparent visible={motionOpen} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.motionModalCard}>
            <View style={styles.motionGlow} />

            <View style={styles.motionHeader}>
              <View style={styles.motionTitleRow}>
                <View style={styles.motionIconWrap}>
                  <Ionicons name="git-compare-outline" size={18} color="#E5E7EB" />
                </View>

                <View>
                  <Text style={styles.motionEyebrow}>Movement Review</Text>
                  <Text style={styles.motionTitle}>Motion Comparison</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setMotionOpen(false)}
                style={styles.motionCloseBtn}
                activeOpacity={0.9}
              >
                <Ionicons name="close" size={18} color="#E5E7EB" />
              </TouchableOpacity>
            </View>

            <View style={styles.motionSwitchRow}>
              <TouchableOpacity
                onPress={() => setMotionType("original")}
                style={[
                  styles.motionSwitchBtn,
                  motionType === "original" && styles.motionSwitchBtnActive,
                ]}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="play-back-outline"
                  size={16}
                  color={motionType === "original" ? "#E5E7EB" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.motionSwitchText,
                    motionType === "original" && styles.motionSwitchTextActive,
                  ]}
                >
                  Before
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMotionType("reconstructed")}
                style={[
                  styles.motionSwitchBtn,
                  motionType === "reconstructed" && styles.motionSwitchBtnActive,
                ]}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={motionType === "reconstructed" ? "#E5E7EB" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.motionSwitchText,
                    motionType === "reconstructed" && styles.motionSwitchTextActive,
                  ]}
                >
                  After
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.motionViewerCard}>
              <FitnessTrainerPuppetSvg
                frames={
                  motionType === "original"
                    ? selectedMotion?.originalFrames
                    : selectedMotion?.reconstructedFrames
                }
              />
            </View>

            {/* <TouchableOpacity
              style={styles.motionDoneBtn}
              onPress={() => setMotionOpen(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.motionDoneBtnText}>Close</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </Modal>
    </View>

    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: 20 },

  hero: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.30)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#E5E7EB",
    fontWeight: "900",
    fontSize: 16,
  },
  profileName: { color: "#E5E7EB", fontSize: 18, fontWeight: "900" },
  profileEmail: { color: "#9CA3AF", marginTop: 2 },
  errorText: { color: "#FCA5A5", marginTop: 6, fontWeight: "700" },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "700" },
  statValue: { color: "#E5E7EB", fontSize: 18, fontWeight: "900" },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: "#3B82F6",
    borderColor: "rgba(59,130,246,0.35)",
  },
  actionSecondary: {
    backgroundColor: "#1E293B",
    borderColor: "rgba(148,163,184,0.18)",
  },
  actionText: { color: "#E5E7EB", fontWeight: "900" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: { color: "#E5E7EB", fontSize: 16, fontWeight: "900" },
  countPill: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  countPillText: { color: "#E5E7EB", fontWeight: "900", fontSize: 12 },

  loadingText: { color: "#9CA3AF", textAlign: "center", marginTop: 10 },

  emptyBox: {
    marginTop: 10,
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
    alignItems: "center",
  },
  emptyText: { color: "#9CA3AF", marginTop: 8, fontWeight: "700" },

  modalBackdrop: {
  flex: 1,
  backgroundColor: "rgba(2,6,23,0.75)",
  justifyContent: "center",
  padding: 16,
},
motionModalCard: {
  backgroundColor: "#020617",
  borderRadius: 24,
  padding: 18,
  borderWidth: 1,
  borderColor: "rgba(59,130,246,0.20)",
  overflow: "hidden",
},

motionGlow: {
  position: "absolute",
  top: -40,
  right: -30,
  width: 140,
  height: 140,
  borderRadius: 999,
  backgroundColor: "rgba(59,130,246,0.10)",
},

motionHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

motionTitleRow: {
  flexDirection: "row",
  alignItems: "center",
},

motionIconWrap: {
  width: 42,
  height: 42,
  borderRadius: 14,
  backgroundColor: "rgba(59,130,246,0.14)",
  borderWidth: 1,
  borderColor: "rgba(59,130,246,0.24)",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
},

motionEyebrow: {
  color: "#60A5FA",
  fontSize: 12,
  fontWeight: "800",
  marginBottom: 2,
},

motionTitle: {
  color: "#E5E7EB",
  fontWeight: "900",
  fontSize: 18,
},

motionCloseBtn: {
  width: 38,
  height: 38,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(148,163,184,0.10)",
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.15)",
},

motionSwitchRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 18,
  marginBottom: 14,
},

motionSwitchBtn: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  backgroundColor: "#0F172A",
  borderRadius: 14,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.12)",
},

motionSwitchBtnActive: {
  backgroundColor: "rgba(59,130,246,0.18)",
  borderColor: "rgba(59,130,246,0.30)",
},

motionSwitchText: {
  color: "#94A3B8",
  fontWeight: "900",
},

motionSwitchTextActive: {
  color: "#E5E7EB",
},

motionViewerCard: {
  height: 360,
  borderRadius: 20,
  overflow: "hidden",
  backgroundColor: "#0B1220",
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.12)",
  padding: 10,
},

motionDoneBtn: {
  marginTop: 16,
  backgroundColor: "#1E293B",
  borderRadius: 16,
  paddingVertical: 13,
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.15)",
},

motionDoneBtnText: {
  color: "#E5E7EB",
  fontWeight: "900",
  textAlign: "center",
},


});
