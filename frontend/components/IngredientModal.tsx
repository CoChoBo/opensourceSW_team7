import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addIngredient } from "../utils/db";
// 데이터 파일 불러오기
import { CATEGORIES, INGREDIENT_LIST } from "../constants/indredientData";

interface Props {
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function IngredientModal({ visible, onClose, onRefresh }: Props) {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  // 팝업 상태 관리
  const [targetItem, setTargetItem] = useState<typeof INGREDIENT_LIST[0] | null>(null);
  const [daysInput, setDaysInput] = useState("");

  // 필터링 로직
  const filteredData = useMemo(() => {
    return INGREDIENT_LIST.filter((item) => {
      const matchSearch = item.name.includes(searchText);
      const matchCategory =
        selectedCategory === "전체" || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [searchText, selectedCategory]);

  // 아이템 클릭 시 팝업 열기
  const handleItemPress = (item: typeof INGREDIENT_LIST[0]) => {
    setTargetItem(item);
    setDaysInput(item.expiry.toString());
  };

  // 팝업 닫기
  const closePopup = () => {
    setTargetItem(null);
    setDaysInput("");
  };

  // DB 저장
  const handleConfirmAdd = () => {
    if (!targetItem) return;

    const expiry = parseInt(daysInput);
    if (isNaN(expiry) || expiry < 0) {
      Alert.alert("오류", "올바른 날짜를 입력해주세요.");
      return;
    }

    addIngredient(targetItem.name, expiry, targetItem.category, () => {
      Alert.alert("완료", `${targetItem.name} (D-${expiry}) 냉장고에 쏙!`);
      onRefresh();
      closePopup();
    });
  };

  // 날짜 조절 버튼
  const adjustDays = (amount: number) => {
    const current = parseInt(daysInput) || 0;
    const nextVal = Math.max(0, current + amount);
    setDaysInput(nextVal.toString());
  };

  const renderItem = ({ item }: { item: typeof INGREDIENT_LIST[0] }) => {
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.itemIcon}>{item.icon}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>재료 담기</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="재료명을 검색해보세요"
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* 카테고리 탭 */}
        <View style={styles.categoryRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.catChip,
                  selectedCategory === item && styles.catChipActive,
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.catText,
                    selectedCategory === item && styles.catTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 그리드 리스트 */}
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
             <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          }
        />

        {/* 🚀 소비기한 설정 팝업 */}
        {targetItem && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.popupOverlay}
          >
            <View style={styles.popupCard}>
              <Text style={styles.popupTitle}>
                {targetItem.icon} {targetItem.name} 추가하기
              </Text>
              <Text style={styles.popupDesc}>남은 소비기한을 설정해주세요.</Text>

              <View style={styles.dateControl}>
                <TouchableOpacity onPress={() => adjustDays(-1)} style={styles.controlBtn}>
                  <Ionicons name="remove" size={24} color="#374151" />
                </TouchableOpacity>
                
                <View style={styles.inputWrapper}>
                    <Text style={styles.dDayPrefix}>D - </Text>
                    <TextInput
                        style={styles.dateInput}
                        keyboardType="numeric"
                        value={daysInput}
                        onChangeText={setDaysInput}
                    />
                </View>

                <TouchableOpacity onPress={() => adjustDays(1)} style={styles.controlBtn}>
                  <Ionicons name="add" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closePopup}>
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAdd}>
                  <Text style={styles.confirmText}>냉장고에 넣기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

      </SafeAreaView>
    </Modal>
  );
}

// 👇 여기서부터 스타일 정의 (이 부분이 빠져서 에러가 났던 거예요!)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#111827", height: '100%' },
  categoryRow: { marginBottom: 10, height: 40 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  catChipActive: { backgroundColor: "#111827" },
  catText: { fontSize: 14, color: "#4b5563", fontWeight: "600" },
  catTextActive: { color: "#ffffff" },
  listContent: { paddingHorizontal: 15, paddingBottom: 50 },
  columnWrapper: { justifyContent: "flex-start", gap: 10, marginBottom: 12 },
  gridItem: {
    flex: 1,
    maxWidth: "31%",
    aspectRatio: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    margin: '1%'
  },
  itemIcon: { fontSize: 32, marginBottom: 8 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#374151" },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#9ca3af' },

  // --- 팝업 스타일 (새로 추가된 부분) ---
  popupOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  popupCard: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupTitle: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 8 },
  popupDesc: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  
  dateControl: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 15,
  },
  controlBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#3b82f6',
    paddingBottom: 5
  },
  dDayPrefix: { fontSize: 24, fontWeight: 'bold', color: '#3b82f6' },
  dateInput: {
    fontSize: 28, fontWeight: "bold", color: "#3b82f6",
    textAlign: "center", minWidth: 50,
  },

  btnRow: { flexDirection: "row", gap: 10, width: '100%' },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center",
  },
  confirmBtn: {
    flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#3b82f6", alignItems: "center",
  },
  cancelText: { color: "#4b5563", fontWeight: "600" },
  confirmText: { color: "white", fontWeight: "bold" },
});