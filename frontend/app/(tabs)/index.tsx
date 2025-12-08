// app/(tabs)/index.tsx
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  const menuItems = [
    { label: "식재료 관리", path: "/ingredients", emoji: "🥕" },
    { label: "소비기한 알림", path: "/expiry", emoji: "⏰" },
    { label: "레시피 추천", path: "/recipes", emoji: "🍳" },
    { label: "음식물 쓰레기 분석", path: "/waste-analysis", emoji: "🗑" },
    { label: "환경/분리배출 가이드", path: "/guide", emoji: "♻️" },
    { label: "마이페이지(포인트)", path: "/mypage", emoji: "⭐" },
    { label: "이미지 분석(카메라)", path: "/camera", emoji: "📷" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 상단 설명 */}
        <View style={styles.header}>
          <Text style={styles.title}>🥬 냉장고를 지켜줘</Text>
          <Text style={styles.subtitle}>
            식재료 관리 · 레시피 추천 · 음식물 쓰레기 감소 · 친환경 가이드 서비스
          </Text>
        </View>

        {/* 메뉴 카드들 */}
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <Pressable
              key={item.path}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.push(item.path as any)}
            >
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>탭해서 상세 화면으로 이동</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* 하단 설명 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LogMeal Food AI + FastAPI + SQLite{"\n"}
            React Native Frontend (기능은 순차 구현 예정)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 20,
  },
  menuList: {
    gap: 12,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  menuEmoji: {
    fontSize: 26,
    marginRight: 14,
  },
  menuTextBox: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  menuDesc: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 16,
  },
});
