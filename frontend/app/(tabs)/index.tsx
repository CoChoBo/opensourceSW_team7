// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// 화면 크기 가져오기
const { width } = Dimensions.get("window");

export default function FridgeHomeScreen() {
  const router = useRouter();
  const { open } = useLocalSearchParams<{ open?: string }>(); // ✅ 쿼리 파라미터 받기

  const [isOpen, setIsOpen] = useState(false); // 냉장고 열림 상태
  const openProgress = useSharedValue(0);      // 애니메이션 값 (0: 닫힘, 1: 열림)

  // ✅ URL에 ?open=1 이 붙어 있으면 처음부터 냉장고 열어주기
  useEffect(() => {
    if (open === "1") {
      setIsOpen(true);
      openProgress.value = withSpring(1, {
        damping: 15,
        stiffness: 100,
      });
    }
  }, [open]);

  // 메뉴 아이템 (4개)
  const menuItems = [
    { label: "나의 냉장고", path: "/ingredients", icon: "nutrition", color: "#fca5a5" }, // 빨강 (사과 느낌)
    { label: "레시피 추천", path: "/recipes", icon: "restaurant", color: "#fde047" },   // 노랑 (계란/치즈)
    { label: "분리수거", path: "/waste-analysis", icon: "leaf", color: "#86efac" },     // 초록 (채소)
    { label: "마이페이지", path: "/mypage", icon: "person", color: "#93c5fd" },         // 파랑 (물/얼음)
  ];

  // 냉장고 열기/닫기 함수
  const toggleFridge = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    // 부드러운 스프링 애니메이션 적용
    openProgress.value = withSpring(nextState ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  };

  // 왼쪽 문 애니메이션 (왼쪽으로 이동)
  const leftDoorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(openProgress.value, [0, 1], [0, -width / 2]);
    return { transform: [{ translateX }] };
  });

  // 오른쪽 문 애니메이션 (오른쪽으로 이동)
  const rightDoorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(openProgress.value, [0, 1], [0, width / 2]);
    return { transform: [{ translateX }] };
  });

  // 내부 내용 투명도 애니메이션 (서서히 나타남)
  const innerContentStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(openProgress.value, [0, 0.8, 1], [0, 0.5, 1]),
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. 냉장고 내부 (메뉴판) */}
      <Animated.View style={[styles.innerContainer, innerContentStyle]}>
        <View style={styles.shelfHeader}>
          <Text style={styles.welcomeText}>어서오세요! 무엇을 할까요?</Text>
          {/* 다시 닫기 버튼 */}
          <TouchableOpacity onPress={toggleFridge} style={styles.closeBtn}>
            <Ionicons name="close-circle" size={30} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuCard, { backgroundColor: item.color + "20" }]} // 연한 배경색
              onPress={() => router.push(item.path as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={32} color="#1f2937" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerText}>LogMeal AI Fridge</Text>
      </Animated.View>

      {/* 2. 냉장고 문 (겉면) - 절대 위치로 덮어씌움 */}
      <View style={styles.doorOverlay} pointerEvents={isOpen ? "none" : "auto"}>
        {/* 왼쪽 문 */}
        <Animated.View style={[styles.door, styles.leftDoor, leftDoorStyle]}>
          <View style={styles.handleBar} />
          <Text style={styles.doorText}>냉장고를</Text>
        </Animated.View>

        {/* 오른쪽 문 */}
        <Animated.View style={[styles.door, styles.rightDoor, rightDoorStyle]}>
          <View style={styles.handleBar} />
          <Text style={styles.doorText}>지켜줘</Text>
        </Animated.View>

        {/* 문 열기 트리거 (투명 버튼) */}
        {!isOpen && (
          <TouchableOpacity style={styles.touchArea} onPress={toggleFridge}>
            <View style={styles.clickHint}>
              <Ionicons
                name="finger-print"
                size={40}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.clickText}>터치해서 열기</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" }, // 전체 배경 (어두운 색)

  // --- 내부 (Inner) 스타일 ---
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    zIndex: 1,
  },
  shelfHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  welcomeText: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  closeBtn: { padding: 5 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    justifyContent: "center",
  },
  menuCard: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  menuLabel: { fontSize: 16, fontWeight: "bold", color: "#e5e7eb" },
  footerText: {
    textAlign: "center",
    marginTop: 40,
    color: "#4b5563",
    fontSize: 12,
  },

  // --- 문 (Doors) 스타일 ---
  doorOverlay: {
    ...StyleSheet.absoluteFillObject, // 화면 전체를 덮음
    flexDirection: "row",
    zIndex: 10, // 내부보다 위에 있어야 함
  },
  door: {
    flex: 1,
    backgroundColor: "#e2e8f0", // 메탈 실버 느낌
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  leftDoor: { borderRightWidth: 1, borderRightColor: "#94a3b8" },
  rightDoor: { borderLeftWidth: 1, borderLeftColor: "#94a3b8" },

  handleBar: {
    width: 8,
    height: 120,
    backgroundColor: "#94a3b8", // 손잡이 색상
    borderRadius: 4,
    marginHorizontal: 10,
  },
  doorText: {
    position: "absolute",
    top: "40%",
    fontSize: 28,
    fontWeight: "900",
    color: "#94a3b8",
    opacity: 0.3, // 은은하게 글씨 보임
    transform: [{ rotate: "-90deg" }],
  },

  // 터치 영역
  touchArea: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  clickHint: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 20,
    borderRadius: 20,
  },
  clickText: { color: "white", marginTop: 10, fontWeight: "bold" },
});
