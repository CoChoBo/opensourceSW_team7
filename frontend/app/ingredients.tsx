// app/ingredients.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import IngredientModal from "../components/IngredientModal";
import { CATEGORIES } from "../constants/indredientData";
import { getUser, LoggedInUser } from "../utils/auth"; // ✅ 로그인 유저 불러오기
import { deleteIngredient, getIngredients, initDB } from "../utils/db";

export default function IngredientsScreen() {
  const router = useRouter();

  const [user, setUser] = useState<LoggedInUser | null>(null); // ✅ 현재 로그인 유저
  const [items, setItems] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // 필터 관련 상태
  const [showFilter, setShowFilter] = useState(false);
  const [filterCategory, setFilterCategory] = useState("전체");
  const [sortBy, setSortBy] = useState<"expiry" | "name">("expiry");

  // ✅ 처음 화면 로딩 시: 유저 + DB 초기화 + 데이터 로딩
  useEffect(() => {
    const init = async () => {
      try {
        const u = await getUser();
        setUser(u);

        await initDB();

        if (u) {
          loadData(u.id);
        }
      } catch (err) {
        console.log(err);
      }
    };

    init();
  }, []);

  // ✅ 화면에 다시 포커스될 때마다 유저 기준으로 재로딩
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadData(user.id);
    }, [user])
  );

  // ✅ userId 기반 데이터 로딩
  const loadData = (userId: string) => {
    getIngredients(userId, setItems);
  };

  const handleDelete = (id: number) => {
    if (!user) return;

    Alert.alert("삭제", "정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteIngredient(user.id, id, () => loadData(user.id)),
      },
    ]);
  };

  const handleEditPress = (item: any) => {
    setEditItem(item);
    setModalVisible(true);
  };

  const processedItems = useMemo(() => {
    let result = [...items];
    if (filterCategory !== "전체") {
      result = result.filter((item) => item.category === filterCategory);
    }
    if (sortBy === "expiry") {
      result.sort((a, b) => a.expiry - b.expiry);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [items, filterCategory, sortBy]);

  const getDDayColor = (days: number) => {
    if (days <= 5) return "#ef4444";
    if (days <= 10) return "#f97316";
    return "#22c55e";
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleEditPress(item)}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.icon}>{item.icon}</Text>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
        </View>

        <Text style={[styles.dDay, { color: getDDayColor(item.expiry) }]}>
          D-{item.expiry}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={() => setShowFilter(false)}>
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.headerRow}>
            {/* 🔙 뒤로가기 : 탭 홈으로 가되, 냉장고 문은 열린 상태(open=1) */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)",
                  params: { open: "1" },
                })
              }
            >
              <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>🥕 식재료</Text>

            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setShowFilter(!showFilter)}
            >
              <Ionicons name="options" size={24} color="#e5e7eb" />
              <Text style={styles.filterBtnText}>필터/정렬</Text>
            </TouchableOpacity>
          </View>

          {/* 필터 드롭박스 */}
          {showFilter && (
            <View style={styles.dropboxContainer}>
              <Text style={styles.dropboxLabel}>정렬 기준</Text>
              <View style={styles.dropboxRow}>
                <TouchableOpacity
                  style={[
                    styles.dropboxOption,
                    sortBy === "expiry" && styles.optionActive,
                  ]}
                  onPress={() => setSortBy("expiry")}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === "expiry" && styles.optionTextActive,
                    ]}
                  >
                    소비기한순
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dropboxOption,
                    sortBy === "name" && styles.optionActive,
                  ]}
                  onPress={() => setSortBy("name")}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === "name" && styles.optionTextActive,
                    ]}
                  >
                    이름순
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <Text style={styles.dropboxLabel}>카테고리 필터</Text>
              <View style={styles.dropboxGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.dropboxChip,
                      filterCategory === cat && styles.chipActive,
                    ]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filterCategory === cat && styles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 필터 상태 표시 */}
          {filterCategory !== "전체" && (
            <View style={styles.filterSummary}>
              <Text style={styles.filterSummaryText}>
                '{filterCategory}'만 보는 중 ({processedItems.length}개)
              </Text>
              <TouchableOpacity onPress={() => setFilterCategory("전체")}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}

          {/* 리스트 */}
          <FlatList
            data={processedItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {filterCategory === "전체"
                  ? "냉장고가 텅 비었어요!\n(+ 버튼이나 카메라로 추가해보세요)"
                  : `"${filterCategory}" 카테고리에 해당하는 재료가 없어요.`}
              </Text>
            }
          />

          {/* 하단 버튼들 */}
          <TouchableOpacity
            style={[styles.fab, styles.cameraFab]}
            onPress={() => router.push("/camera")}
          >
            <Ionicons name="camera" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fab, styles.addFab]}
            onPress={() => {
              setEditItem(null);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>

          <IngredientModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onRefresh={() => user && loadData(user.id)} // ✅ user 기준으로 새로고침
            editItem={editItem}
            userId={user?.id} // ✅ 로그인한 유저 id 전달
          />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    zIndex: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#e5e7eb" },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1e293b",
    padding: 8,
    borderRadius: 8,
  },
  filterBtnText: { color: "#e5e7eb", fontSize: 14, fontWeight: "600" },
  dropboxContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    left: 20,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#374151",
    elevation: 10,
  },
  dropboxLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "bold",
  },
  dropboxRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  dropboxOption: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#374151",
    alignItems: "center",
  },
  optionActive: { backgroundColor: "#3b82f6" },
  optionText: { color: "#9ca3af", fontWeight: "600" },
  optionTextActive: { color: "white" },
  divider: { height: 1, backgroundColor: "#374151", marginBottom: 12 },
  dropboxGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dropboxChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#374151",
    marginBottom: 4,
  },
  chipActive: { backgroundColor: "#3b82f6" },
  chipText: { color: "#d1d5db", fontSize: 13 },
  chipTextActive: { color: "white", fontWeight: "bold" },
  filterSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
    backgroundColor: "#1e293b",
    padding: 8,
    borderRadius: 8,
  },
  filterSummaryText: { color: "#60a5fa", fontSize: 14, fontWeight: "600" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { fontSize: 24 },
  name: { fontSize: 16, fontWeight: "bold", color: "white" },
  category: { fontSize: 12, color: "#9ca3af" },
  dDay: { fontSize: 14, fontWeight: "bold" },
  deleteBtn: {
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: "#374151",
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 50,
    lineHeight: 24,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addFab: { bottom: 20, backgroundColor: "#3b82f6" },
  cameraFab: { bottom: 90, backgroundColor: "#8b5cf6" },
});
