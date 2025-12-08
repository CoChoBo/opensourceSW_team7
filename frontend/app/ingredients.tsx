import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router"; // 1. useRouter 추가
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import IngredientModal from "../components/IngredientModal";
import { deleteIngredient, getIngredients, initDB } from "../utils/db";

export default function IngredientsScreen() {
  const router = useRouter(); // 2. 라우터 사용 선언
  const [activeTab, setActiveTab] = useState<"list" | "expiry">("list");
  const [items, setItems] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    initDB().then(() => loadData()).catch((err) => console.log(err));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = () => {
    getIngredients(setItems);
  };

  const handleDelete = (id: number) => {
    Alert.alert("삭제", "정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deleteIngredient(id, () => loadData()) },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.icon}>{item.icon}</Text>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.dDay, item.expiry <= 3 && styles.urgent]}>
          D-{item.expiry}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const urgentItems = items.filter((item) => item.expiry <= 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>🥕 식재료</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "list" && styles.activeTab]}
            onPress={() => setActiveTab("list")}
          >
            <Text style={[styles.tabText, activeTab === "list" && styles.activeTabText]}>
              전체 목록
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "expiry" && styles.activeTab]}
            onPress={() => setActiveTab("expiry")}
          >
            <Text style={[styles.tabText, activeTab === "expiry" && styles.activeTabText]}>
              소비기한 임박 ({urgentItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={activeTab === "list" ? items : urgentItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }} // 버튼에 가리지 않게 여백 추가
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              냉장고가 텅 비었어요!{"\n"}(+ 버튼이나 카메라로 추가해보세요)
            </Text>
          }
        />

        {/* 🚀 3. 카메라 버튼 (보라색) - 위에 배치 */}
        <TouchableOpacity
          style={[styles.fab, styles.cameraFab]}
          onPress={() => router.push("/camera")} // 카메라 화면으로 이동
        >
          <Ionicons name="camera" size={28} color="white" />
        </TouchableOpacity>

        {/* 4. 기존 수동 추가 버튼 (파란색) - 아래 배치 */}
        <TouchableOpacity
          style={[styles.fab, styles.addFab]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>

        <IngredientModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onRefresh={loadData}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#e5e7eb", marginBottom: 20 },
  tabContainer: { flexDirection: "row", marginBottom: 20, backgroundColor: "#1e293b", borderRadius: 8, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 6 },
  activeTab: { backgroundColor: "#3b82f6" },
  tabText: { color: "#94a3b8", fontWeight: "600" },
  activeTabText: { color: "#ffffff" },
  card: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1f2937", padding: 16, borderRadius: 12, marginBottom: 12 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { fontSize: 24 },
  name: { fontSize: 16, fontWeight: "bold", color: "white" },
  category: { fontSize: 12, color: "#9ca3af" },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  dDay: { fontSize: 14, color: "#34d399", fontWeight: "bold" },
  urgent: { color: "#f87171" },
  emptyText: { color: "#6b7280", textAlign: "center", marginTop: 50, lineHeight: 24 },
  
  // --- 버튼 스타일 ---
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
  // 수동 추가 버튼 (파란색)
  addFab: {
    bottom: 20,
    backgroundColor: "#3b82f6",
  },
  // 카메라 버튼 (보라색, 수동 추가 버튼 바로 위에 위치)
  cameraFab: {
    bottom: 90, // 20(아래버튼) + 56(버튼크기) + 14(간격)
    backgroundColor: "#8b5cf6", // 구분되게 보라색 사용
  },
});