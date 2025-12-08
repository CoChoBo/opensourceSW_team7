// app/ingredients.tsx
import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View, FlatList, ActivityIndicator } from "react-native";
import { API_BASE_URL } from "@/constants/api";

type Ingredient = {
  id: number;
  name: string;
  category?: string | null;
  expected_expiry?: string | null;
  status?: string | null;
};

export default function IngredientsScreen() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/ingredients`);
      if (!res.ok) throw new Error("Failed to fetch ingredients");

      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const renderItem = ({ item }: { item: Ingredient }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardText}>카테고리: {item.category || "-"}</Text>
      <Text style={styles.cardText}>
        예상 소비기한:{" "}
        {item.expected_expiry
          ? new Date(item.expected_expiry).toLocaleDateString()
          : "-"}
      </Text>
      <Text style={styles.cardText}>상태: {item.status || "-"}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🥕 식재료 관리</Text>
        <Text style={styles.desc}>
          - Streamlit의 "식재료 등록 / 관리" 화면에 해당하는 곳입니다.{"\n"}
          - 나중에 여기서 식재료 목록 조회, 추가/수정 기능을 구현합니다.
        </Text>

        {loading && <ActivityIndicator size="large" color="#22c55e" />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#e5e7eb", marginBottom: 12 },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardTitle: {
    fontSize: 18,
    color: "#e5e7eb",
    fontWeight: "700",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 4,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 10,
  },
  desc: { fontSize: 14, color: "#9ca3af", lineHeight: 20 },
});
