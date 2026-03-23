import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { getStreamSource } from "../services/video.service";

type Props = {
  visible: boolean;
  videoDocId: string | null;
  onClose: () => void;
};

type VideoSource = {
  uri: string;
  headers: {
    Authorization: string;
  };
};

export default function VideoPlayerModal({ visible, videoDocId, onClose }: Props) {
  const [source, setSource] = useState<VideoSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!visible || !videoDocId) return;
      try {
        setErr("");
        setLoading(true);
        const s = await getStreamSource(videoDocId);
        if (mounted) setSource(s);
      } catch (e: unknown) {
      if (mounted) {
        if (e instanceof Error) {
          setErr(e.message);
        } else {
          setErr("Failed to load video");
        }
      }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
      setSource(null);
    };
  }, [visible, videoDocId]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Watch Video</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading video...</Text>
            </View>
          ) : err ? (
            <View style={styles.center}>
              <Text style={styles.error}>{err}</Text>
            </View>
          ) : source ? (
            <View style={styles.playerWrap}>
              <Video
                source={source}                 
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.muted}>No video selected.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.75)",
    padding: 16,
    justifyContent: "center",
  },
  sheet: {
    backgroundColor: "#020617",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.20)",
    overflow: "hidden",
  },
  headerRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.15)",
  },
  title: { color: "#E5E7EB", fontSize: 16, fontWeight: "800" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  closeText: { color: "#E5E7EB", fontSize: 16, fontWeight: "800" },
  playerWrap: { padding: 12 },
  video: { width: "100%", height: 320, backgroundColor: "#0B1220", borderRadius: 12 },
  center: { padding: 20, alignItems: "center", gap: 10 },
  muted: { color: "#9CA3AF", textAlign: "center" },
  error: { color: "#FCA5A5", textAlign: "center", fontWeight: "700" },
});
