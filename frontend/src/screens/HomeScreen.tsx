import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const HomeScreen: React.FC = () => {
  const handleStartAnalyze = () => {
    console.log("분석 시작 버튼 클릭");
  };

  const handleOpenHistory = () => {
    console.log("히스토리 버튼 클릭");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>푸드 AI 분석 서비스</Text>
          <Text style={styles.subtitle}>
            음식 사진을 업로드하면{"\n"}
            영양 정보와 환경 영향을 함께 보여줍니다.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartAnalyze}
          >
            <Text style={styles.primaryButtonText}>🍽 분석 시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenHistory}
          >
            <Text style={styles.secondaryButtonText}>📜 기록 보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LogMeal AI + FastAPI + SQLite{"\n"}React Native Frontend
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#9ca3af",
    lineHeight: 22,
  },
  buttonGroup: {
    gap: 14,
  },
  primaryButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#64748b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 16,
  },
});
