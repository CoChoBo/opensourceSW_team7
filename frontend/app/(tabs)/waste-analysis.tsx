// app/waste-analysis.tsx
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WasteAnalysisScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🗑 음식물 쓰레기 분석</Text>
        <Text style={styles.desc}>
          - 음식물 쓰레기 배출량 기록 및 변화 추이를 그래프로 보여주는 화면입니다.{"\n"}
          - 추후 RN에서 차트 라이브러리(Recharts/ Victory 등)를 사용해 시각화합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#e5e7eb", marginBottom: 12 },
  desc: { fontSize: 14, color: "#9ca3af", lineHeight: 20 },
});
