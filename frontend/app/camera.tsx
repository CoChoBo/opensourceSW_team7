// app/camera.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "../constants/api";

type ScanResult = {
  id: number;
  name: string;
  category?: string | null;
  expected_expiry?: string | null;
  status?: string;
};

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  // 카메라로 촬영
  const handleOpenCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "카메라 권한을 허용해 주세요.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setResult(null);
    }
  };

  // 갤러리에서 선택
  const handleOpenGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한을 허용해 주세요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setResult(null);
    }
  };

  const handleClear = () => {
    setImageUri(null);
    setResult(null);
  };

  // ✅ 백엔드로 이미지 전송 → YOLO + DB 저장
  const handleUploadToBackend = async () => {
    if (!imageUri) {
      Alert.alert("이미지 없음", "먼저 사진을 촬영하거나 선택해주세요.");
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${API_BASE_URL}/api/ingredients/scan`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.log("업로드 실패 응답:", text);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as ScanResult;
      console.log("백엔드 응답:", data);
      setResult(data);

      Alert.alert(
        "등록 완료",
        `인식된 식재료: ${data.name}\n카테고리: ${
          data.category ?? "-"
        }\n예상 소비기한: ${data.expected_expiry ?? "-"}`
      );
    } catch (err) {
      console.error("업로드 오류:", err);
      Alert.alert(
        "업로드 실패",
        "이미지 업로드 또는 분석 중 오류가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>📷 음식 사진 업로드</Text>
        <Text style={styles.desc}>
          카메라로 촬영하거나 갤러리에서 사진을 선택한 뒤{"\n"}
          백엔드로 전송해 식재료를 자동 인식하고 냉장고에 등록합니다.
        </Text>

        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={handleOpenCamera}>
            <Text style={styles.primaryText}>카메라로 촬영</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleOpenGallery}>
            <Text style={styles.secondaryText}>갤러리에서 선택</Text>
          </Pressable>
        </View>

        {/* 이미지 미리보기 + 업로드 버튼 */}
        <View style={styles.previewBox}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.image} />

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.uploadButton}
                  onPress={handleUploadToBackend}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <Text style={styles.uploadText}>백엔드로 전송</Text>
                  )}
                </Pressable>

                <Pressable style={styles.clearButton} onPress={handleClear}>
                  <Text style={styles.clearText}>사진 지우기</Text>
                </Pressable>
              </View>

              {result && (
                <View style={styles.resultBox}>
                  <Text style={styles.resultTitle}>인식 결과</Text>
                  <Text style={styles.resultText}>
                    식재료명: {result.name}
                  </Text>
                  <Text style={styles.resultText}>
                    카테고리: {result.category ?? "-"}
                  </Text>
                  <Text style={styles.resultText}>
                    예상 소비기한: {result.expected_expiry ?? "-"}
                  </Text>
                  <Text style={styles.resultText}>
                    상태: {result.status ?? "-"}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.previewText}>
              아직 선택된 사진이 없습니다.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#64748b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryText: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
  },
  previewBox: {
    flex: 1,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  previewText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "80%",
    borderRadius: 12,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  uploadText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  clearText: {
    color: "#e5e7eb",
    fontSize: 13,
  },
  resultBox: {
    marginTop: 10,
    width: "100%",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 4,
  },
  resultText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
});
