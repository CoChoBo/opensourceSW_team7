// app/(tabs)/recipes.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RecipesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 🔙 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)")}>
            <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
          </TouchableOpacity>
          <Text style={styles.title}>레시피 추천</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.desc}>
          - 보유 식재료를 선택하면 레시피 목록과 칼로리 비교를 보여주는 화면입니다.
          {"\n"}- Streamlit의 레시피 추천 UI를 RN용으로 재구성할 예정입니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#e5e7eb" },
  desc: { fontSize: 14, color: "#9ca3af", lineHeight: 20 },
});
