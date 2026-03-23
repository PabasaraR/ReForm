import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { analyzeVideo } from "../services/video.service";
import FitnessTrainerPuppetSvg from "../components/FitnessTrainerPuppetSvg"

function toTitleCaseFromKey(key?: string) {
  if (!key) return "Exercise";
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function UploadScreen() {
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [badRatio, setBadRatio] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [originalFrames , setOriginalFrames] = useState([]);
  const [reconstructedFrames , setReconstructedFrames] = useState([]);
  const { exercise } = useLocalSearchParams<{ exercise: string }>();
  const [modalView, setModalView] = useState("result")
  const [motionType, setMotionType] = useState("reconstructed")

  const exerciseTitle = useMemo(
    () => toTitleCaseFromKey(String(exercise || "")),
    [exercise]
  );

  const instructions = useMemo(() => {
    const key = String(exercise || "");
    if (key === "barbell_curl") {
      return {
        title: "Recording Guide",
        lines: [
          "Record from the front (full body visible).",
          "Do only 1 rep: start position → end position.",
          "Keep the camera steady and well-lit.",
        ],
        icon: "barbell-outline" as const,
      };
    }
    if (key === "dumbbell_shoulder_press") {
      return {
        title: "Recording Guide",
        lines: [
          "Record from the front (full body visible).",
          "Do only 1 rep: start position → end position.",
          "Keep elbows and dumbbells clearly visible.",
        ],
        icon: "barbell-outline" as const,
      };
    }
    return {
      title: "Recording Guide",
      lines: [
        "Record from the front (full body visible).",
        "Do only 1 rep: start position → end position.",
        "Keep the camera steady and well-lit.",
      ],
      icon: "videocam-outline" as const,
    };
  }, [exercise]);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });

    if (!result.canceled) {
      const selectedVideo = result.assets[0];

      const fileName = selectedVideo.fileName?.toLowerCase() || "";
      const uri = selectedVideo.uri?.toLowerCase() || "";
      const mimeType = selectedVideo.mimeType?.toLowerCase() || "";

      const isMp4 =
        mimeType === "video/mp4" ||
        fileName.endsWith(".mp4") ||
        uri.endsWith(".mp4");

      if (!isMp4) {
        setLabel("Error");
        setBadRatio(null);
        setFeedbackText("Only MP4 videos are allowed.");
        setShowFeedback(true);
        return;
      }

      setVideo(selectedVideo);
      setLabel("");
      setBadRatio(null);
      setFeedbackText("");
      setShowFeedback(false);
    }
  };

  const submitVideo = async () => {
    if (!video) return;

    try {
      setIsUploading(true);
      // send video to backend for analysis
      const response = await analyzeVideo(String(exercise), video);

      setLabel(response?.result?.label ?? "");
      const br = response?.result?.bad_ratio;
      setBadRatio(typeof br === "number" ? br : null);
      setFeedbackText(response?.result?.feedback ?? "No feedback returned.");
      setOriginalFrames(response?.result?.continuous_frames_before ?? []);
      setReconstructedFrames(response?.result?.continuous_frames_after ?? []);
      // console.log("response1?:", response.result.continuous_frames_after)
      // console.log("response2?:", response.result.continuous_frames_before)

      setShowFeedback(true);
    } catch (e: any) {
      setLabel("Error");
      setBadRatio(null);
      setFeedbackText(e?.message ?? "Something went wrong");
      setShowFeedback(true);
    } finally {
      setIsUploading(false);
    }
  };

  const isCorrect =
    (label || "").toString().toLowerCase() === "correct" ||
    (label || "").toString().toLowerCase() === "right";

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerCard}>
        <Text style={styles.exerciseTitle}>{exerciseTitle}</Text>
        <Text style={styles.subtitle}>Upload a short video and get feedback.</Text>
      </View>

      {/* Instructions */}
      <View style={styles.infoCard}>
        <View style={styles.infoTopRow}>
          <View style={styles.infoIconWrap}>
            <Ionicons name={instructions.icon} size={18} color="#E5E7EB" />
          </View>
          <Text style={styles.infoTitle}>{instructions.title}</Text>
        </View>

        {instructions.lines.map((t, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.infoText}>{t}</Text>
          </View>
        ))}
      </View>

      {/* Pick video */}
      <TouchableOpacity style={styles.pickBtn} onPress={pickVideo} activeOpacity={0.9}>
        <Ionicons name="image-outline" size={18} color="#E5E7EB" />
        <Text style={styles.pickBtnText}>
          {video ? "Change Video" : "Select Video from Gallery"}
        </Text>
      </TouchableOpacity>

      {/* Video preview */}
      {video ? (
        <View style={styles.previewCard}>
          <View style={styles.previewTop}>
            <Ionicons name="videocam-outline" size={18} color="#E5E7EB" />
            <Text style={styles.previewTitle} numberOfLines={1}>
              Preview
            </Text>
          </View>

          <View style={styles.videoWrap}>
            <Video
              source={{ uri: video.uri }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
          </View>

          <Text style={styles.previewHint}>
            Make sure it shows the full movement (1 rep).
          </Text>
        </View>
      ) : (
        <View style={styles.emptyPreview}>
          <Ionicons name="cloud-upload-outline" size={24} color="#9CA3AF" />
          <Text style={styles.emptyText}>No video selected yet.</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (!video || isUploading) && { opacity: 0.6 }]}
        onPress={submitVideo}
        disabled={!video || isUploading}
        activeOpacity={0.9}
      >
        {isUploading ? (
          <View style={styles.submitRow}>
            <ActivityIndicator />
            <Text style={styles.submitText}>Analyzing...</Text>
          </View>
        ) : (
          <View style={styles.submitRow}>
            <Ionicons name="sparkles-outline" size={18} color="#E5E7EB" />
            <Text style={styles.submitText}>Analyze Video</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Feedback popup */}
      <Modal
        transparent
        visible={showFeedback}
        animationType="fade"
        onRequestClose={() => setShowFeedback(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardModern}>
            <View style={styles.modalGlow} />

            <View style={styles.modalHeaderModern}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleIconWrap}>
                  <Ionicons
                    name={modalView === "result" ? "sparkles-outline" : "walk-outline"}
                    size={18}
                    color="#E5E7EB"
                  />
                </View>

                <View>
                  <Text style={styles.modalEyebrow}>Analysis</Text>
                  <Text style={styles.modalTitleModern}>
                    {modalView === "result" ? "Workout Result" : "Motion Compare"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowFeedback(false)}
                style={styles.closeIconBtnModern}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={18} color="#E5E7EB" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  modalView === "result" && styles.tabBtnActive,
                ]}
                onPress={() => setModalView("result")}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={modalView === "result" ? "#E5E7EB" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    modalView === "result" && styles.tabBtnTextActive,
                  ]}
                >
                  Result
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  modalView === "motion" && styles.tabBtnActive,
                ]}
                onPress={() => setModalView("motion")}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="git-compare-outline"
                  size={16}
                  color={modalView === "motion" ? "#E5E7EB" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    modalView === "motion" && styles.tabBtnTextActive,
                  ]}
                >
                  Motion
                </Text>
              </TouchableOpacity>
            </View>

            {modalView === "result" ? (
              <View style={styles.resultSection}>
                {!!label && (
                  <View style={styles.resultTopCard}>
                    <View
                      style={[
                        styles.resultPillModern,
                        isCorrect ? styles.pillOkModern : styles.pillBadModern,
                      ]}
                    >
                      <Ionicons
                        name={isCorrect ? "checkmark-circle-outline" : "alert-circle-outline"}
                        size={16}
                        color="#E5E7EB"
                      />
                      <Text style={styles.resultPillTextModern}>
                        {isCorrect ? "Correct Form" : "Incorrect Form"}
                      </Text>
                    </View>

                    {badRatio !== null ? (
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipLabel}>Bad ratio</Text>
                        <Text style={styles.metaChipValue}>
                          {(badRatio * 100).toFixed(1)}%
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                <View style={styles.feedbackCard}>
                  <Text style={styles.feedbackTitle}>Coach Feedback</Text>
                  <Text style={styles.modalFeedbackModern}>{feedbackText}</Text>
                </View>

                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={() => setShowFeedback(false)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.modalPrimaryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.motionSection}>
                <View style={styles.motionSwitchRow}>
                  <TouchableOpacity
                    style={[
                      styles.motionTypeBtn,
                      motionType === "original" && styles.motionTypeBtnActive,
                    ]}
                    onPress={() => setMotionType("original")}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.motionTypeBtnText,
                        motionType === "original" && styles.motionTypeBtnTextActive,
                      ]}
                    >
                      Before
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.motionTypeBtn,
                      motionType === "reconstructed" && styles.motionTypeBtnActive,
                    ]}
                    onPress={() => setMotionType("reconstructed")}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.motionTypeBtnText,
                        motionType === "reconstructed" && styles.motionTypeBtnTextActive,
                      ]}
                    >
                      After
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.motionCard}>
                  <FitnessTrainerPuppetSvg
                    frames={motionType === "original" ? originalFrames : reconstructedFrames}
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalSecondaryBtn}
                  onPress={() => setModalView("result")}
                  activeOpacity={0.9}
                >
                  <Text style={styles.modalSecondaryBtnText}>Back to Result</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: 20 },

  headerCard: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
    marginBottom: 12,
  },
  brand: { color: "#3B82F6", fontWeight: "900", fontSize: 14 },
  exerciseTitle: { color: "#E5E7EB", fontWeight: "900", fontSize: 18, marginTop: 4 },
  subtitle: { color: "#9CA3AF", marginTop: 6, lineHeight: 18 },

  infoCard: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
    marginBottom: 12,
  },
  infoTopRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { color: "#E5E7EB", fontWeight: "900", fontSize: 14 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 6 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#3B82F6",
    marginTop: 6,
  },
  infoText: { color: "#CBD5E1", lineHeight: 18, flex: 1 },

  pickBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  pickBtnText: { color: "#E5E7EB", fontWeight: "900" },

  previewCard: {
    marginTop: 12,
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
  },
  previewTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  previewTitle: { color: "#E5E7EB", fontWeight: "900", flex: 1 },
  videoWrap: { borderRadius: 14, overflow: "hidden", backgroundColor: "#0B1220" },
  video: { width: "100%", height: 240 },
  previewHint: { color: "#9CA3AF", marginTop: 10 },

  emptyPreview: {
    marginTop: 12,
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: { color: "#9CA3AF", fontWeight: "700" },

  submitBtn: {
    marginTop: 12,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.30)",
  },
  submitRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  submitText: { color: "#E5E7EB", fontWeight: "900" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.75)",
    justifyContent: "center",
    padding: 16,
  },
  
modalCardModern: {
  backgroundColor: "#020617",
  borderRadius: 24,
  padding: 18,
  borderWidth: 1,
  borderColor: "rgba(59,130,246,0.22)",
  overflow: "hidden",
},

modalGlow: {
  position: "absolute",
  top: -40,
  right: -30,
  width: 140,
  height: 140,
  borderRadius: 999,
  backgroundColor: "rgba(59,130,246,0.10)",
},

modalHeaderModern: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

modalTitleRow: {
  flexDirection: "row",
  alignItems: "center",
},

modalTitleIconWrap: {
  width: 42,
  height: 42,
  borderRadius: 14,
  backgroundColor: "rgba(59,130,246,0.14)",
  borderWidth: 1,
  borderColor: "rgba(59,130,246,0.26)",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
},

modalEyebrow: {
  color: "#60A5FA",
  fontSize: 12,
  fontWeight: "800",
  marginBottom: 2,
},

modalTitleModern: {
  color: "#E5E7EB",
  fontWeight: "900",
  fontSize: 18,
},

closeIconBtnModern: {
  width: 38,
  height: 38,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(148,163,184,0.10)",
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.15)",
},

tabRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 18,
  marginBottom: 8,
},

tabBtn: {
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

tabBtnActive: {
  backgroundColor: "rgba(59,130,246,0.18)",
  borderColor: "rgba(59,130,246,0.32)",
},

tabBtnText: {
  color: "#94A3B8",
  fontWeight: "800",
},

tabBtnTextActive: {
  color: "#E5E7EB",
},

resultSection: {
  marginTop: 14,
},

resultTopCard: {
  backgroundColor: "#0B1220",
  borderRadius: 18,
  padding: 14,
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.12)",
},

resultPillModern: {
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  borderWidth: 1,
},

pillOkModern: {
  backgroundColor: "rgba(34,197,94,0.16)",
  borderColor: "rgba(34,197,94,0.35)",
},

pillBadModern: {
  backgroundColor: "rgba(239,68,68,0.16)",
  borderColor: "rgba(239,68,68,0.35)",
},

resultPillTextModern: {
  color: "#E5E7EB",
  fontWeight: "900",
},

metaChip: {
  marginTop: 12,
  backgroundColor: "rgba(148,163,184,0.08)",
  borderRadius: 14,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.12)",
},

metaChipLabel: {
  color: "#94A3B8",
  fontSize: 12,
  marginBottom: 4,
},

metaChipValue: {
  color: "#E5E7EB",
  fontSize: 15,
  fontWeight: "900",
},

feedbackCard: {
  marginTop: 14,
  backgroundColor: "#0B1220",
  borderRadius: 18,
  padding: 14,
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.12)",
},

feedbackTitle: {
  color: "#E5E7EB",
  fontWeight: "900",
  fontSize: 14,
  marginBottom: 10,
},

modalFeedbackModern: {
  color: "#CBD5E1",
  lineHeight: 22,
  fontSize: 14,
},

modalPrimaryBtn: {
  marginTop: 16,
  backgroundColor: "#3B82F6",
  borderRadius: 16,
  paddingVertical: 13,
  borderWidth: 1,
  borderColor: "rgba(59,130,246,0.30)",
},

modalPrimaryBtnText: {
  color: "#E5E7EB",
  fontWeight: "900",
  textAlign: "center",
},

motionSection: {
  marginTop: 14,
},

motionSwitchRow: {
  flexDirection: "row",
  gap: 10,
  marginBottom: 12,
},

motionTypeBtn: {
  flex: 1,
  backgroundColor: "#0F172A",
  borderRadius: 14,
  paddingVertical: 11,
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.12)",
},

motionTypeBtnActive: {
  backgroundColor: "rgba(59,130,246,0.18)",
  borderColor: "rgba(59,130,246,0.32)",
},

motionTypeBtnText: {
  color: "#94A3B8",
  fontWeight: "900",
  textAlign: "center",
},

motionTypeBtnTextActive: {
  color: "#E5E7EB",
},

motionCard: {
  height: 440,
  width: "100%",
  overflow: "hidden",
  borderRadius: 18,
  backgroundColor: "#0B1220",
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.12)",
  padding: 10,
},

modalSecondaryBtn: {
  marginTop: 14,
  backgroundColor: "#1E293B",
  borderRadius: 16,
  paddingVertical: 13,
  borderWidth: 1,
  borderColor: "rgba(148,163,184,0.15)",
},

modalSecondaryBtnText: {
  color: "#E5E7EB",
  fontWeight: "900",
  textAlign: "center",
},
});
