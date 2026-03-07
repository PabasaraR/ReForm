import { API_BASE } from "../constants/api";
import { getToken } from "./token.storage";
import * as ImagePicker from "expo-image-picker";

export async function analyzeVideo(exercise: string, videoAsset: ImagePicker.ImagePickerAsset) {

  const token = await getToken();
  if (!token) throw new Error("No token found. Please sign in again.");

  const formData = new FormData();

  // must match backend key name: exercise
  formData.append("exercise", exercise);

  // must match multer field name: video
  formData.append("video", {
    uri: videoAsset.uri,
    name: videoAsset.fileName ?? "exercise.mp4",
    type: videoAsset.mimeType ?? "video/mp4",
  } as unknown as Blob);

  const res = await fetch(`${API_BASE}/api/videos/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // IMPORTANT: do NOT manually set Content-Type in React Native for FormData
      // RN will set proper boundary automatically.
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || "Analyze request failed";
    throw new Error(msg);
  }

  return data; // { videoId, gridFsId, result, streamUrl, createdAt ... }
}


export async function getMyHistory() {
  const token = await getToken();
  if (!token) throw new Error("No token found. Please sign in again.");

  const res = await fetch(`${API_BASE}/api/videos/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || "History request faileds";
    throw new Error(msg);
  }
  console.log("History data:", data);
  return data; // { items: [...] }
}


export async function getStreamSource(videoDocId: string) {
  const token = await getToken();
  if (!token) throw new Error("No token found. Please sign in again.");

  return {
    uri: `${API_BASE}/api/videos/${videoDocId}/stream`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}