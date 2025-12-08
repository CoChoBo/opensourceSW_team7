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
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);

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
    }
  };

  const handleClear = () => {
    setImageUri(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>📷 음식 사진 업로드</Text>
        <Text style={styles.desc}>
          카메라로 촬영하거나 갤러리에서 사진을 선택해 주세요.{"\n"}
          나중에 이 이미지를 백엔드로 보내서 LogMeal 분석에 사용할 예정입니다.
        </Text>

        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={handleOpenCamera}>
            <Text style={styles.primaryText}>카메라로 촬영</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleOpenGallery}>
            <Text style={styles.secondaryText}>갤러리에서 선택</Text>
          </Pressable>
        </View>

        <View style={styles.previewBox}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <Pressable style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearText}>사진 지우기</Text>
              </Pressable>
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
});
