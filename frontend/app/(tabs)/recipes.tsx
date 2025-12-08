// app/recipes.tsx
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function RecipesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🍳 레시피 추천</Text>
        <Text style={styles.desc}>
          - 보유 식재료를 선택하면 레시피 목록과 칼로리 비교를 보여주는 화면입니다.{"\n"}
          - Streamlit의 레시피 추천 UI를 RN용으로 재구성할 예정입니다.
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
