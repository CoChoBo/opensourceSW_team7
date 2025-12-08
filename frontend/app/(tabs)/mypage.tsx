// app/mypage.tsx
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function MyPageScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>⭐ 마이페이지 / 포인트</Text>
        <Text style={styles.desc}>
          - 포인트, 레벨, 친환경 행동 버튼 등을 보여주는 화면입니다.{"\n"}
          - 추후 백엔드 연동 후, 사용자별 포인트/레벨 정보를 표시할 예정입니다.
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
