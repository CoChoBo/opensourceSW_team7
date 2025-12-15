import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { API_BASE_URL } from "@/constants/api";
import { getAuth } from "@/util/utils/auth";

/** 백엔드 FridgeIngredientOut 타입에 맞춤 */
type Ingredient = {
  id: number;
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expected_expiry?: string; // YYYY-MM-DD
};

export default function IngredientsScreen() {
  const router = useRouter();

  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------
  // 재료 목록 불러오기 (서버)
  // ----------------------------------
  const fetchIngredients = async () => {
    try {
      const auth = await getAuth();
      if (!auth) {
        Alert.alert("로그인 필요", "다시 로그인 해주세요.");
        router.replace("/login");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/ingredients`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("재료 목록 조회 실패");
      }

      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      Alert.alert("에러", "재료 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------
  // 재료 삭제 (서버)
  // ----------------------------------
  const deleteIngredient = async (id: number) => {
    try {
      const auth = await getAuth();
      if (!auth) return;

      const res = await fetch(
        `${API_BASE_URL}/api/ingredients/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("삭제 실패");
      }

      // 성공 시 화면에서 제거
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      Alert.alert("에러", "재료 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // ----------------------------------
  // 렌더
  // ----------------------------------
  const renderItem = ({ item }: { item: Ingredient }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.category ?? "기타"} ·{" "}
          {item.quantity ?? 1}
          {item.unit ?? "ea"}
        </Text>
        {item.expected_expiry && (
          <Text style={styles.expiry}>
            소비기한: {item.expected_expiry}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={() =>
          Alert.alert(
            "삭제",
            `${item.name}을(를) 삭제할까요?`,
            [
              { text: "취소", style: "cancel" },
              {
                text: "삭제",
                style: "destructive",
                onPress: () => deleteIngredient(item.id),
              },
            ]
          )
        }
      >
        <Ionicons name="trash" size={22} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>나의 냉장고</Text>

        <TouchableOpacity
          onPress={() => router.push("/ingredients-add")}
        >
          <Ionicons name="add-circle" size={30} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loading}>불러오는 중...</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              등록된 식재료가 없습니다.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

//
// ---------------- 스타일 ----------------
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#e5e7eb",
  },

  loading: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 20,
  },

  empty: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 40,
  },

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#020617",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
  },

  meta: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },

  expiry: {
    fontSize: 12,
    color: "#f97316",
    marginTop: 4,
  },
});
