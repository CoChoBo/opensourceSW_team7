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

import { API_BASE_URL } from "../../constants/api";

// ⭐ 유통기한 기능
import { getExpiringSoonCount } from "@/util/utils/db";
import { getUser } from "@/util/utils/auth";

// ⭐ 커스텀 모달
import ExpiryAlertModal from "@/components/ExpiryAlertModal";

type BackendStatus = "idle" | "ok" | "error";

const { width } = Dimensions.get("window");

export default function FridgeHomeScreen() {
  const router = useRouter();
  const { open } = useLocalSearchParams<{ open?: string }>();

  const [isOpen, setIsOpen] = useState(false);
  const [alertShown, setAlertShown] = useState(false);

  const [expiryModalVisible, setExpiryModalVisible] = useState(false);
  const [expiryCount, setExpiryCount] = useState(0);

  const openProgress = useSharedValue(0);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("idle");

  // ---------------------------
  // Backend Health Check
  // ---------------------------
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setBackendStatus("ok");
    } catch (err) {
      setBackendStatus("error");
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // ---------------------------
  // ?open=1 받았을 때 자동으로 열기
  // ---------------------------
  useEffect(() => {
    if (open === "1") {
      setIsOpen(true);
      openProgress.value = withSpring(1, { damping: 15, stiffness: 100 });
    }
  }, [open]);

  // ---------------------------
  // 냉장고 문 열기/닫기 + 알림 표시
  // ---------------------------
  const toggleFridge = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    openProgress.value = withSpring(nextState ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });

    // ⭐ 문이 열릴 때 + 아직 알람 안 뜬 경우
    if (nextState === true && !alertShown) {
      const user = await getUser();
      if (user) {
        const count = await getExpiringSoonCount(user.id);
        if (count > 0) {
          setExpiryCount(count);
          setExpiryModalVisible(true); // ⭐ 커스텀 모달 열기
        }
      }
      setAlertShown(true);
    }
  };

  // ---------------------------
  // 애니메이션 스타일
  // ---------------------------
  const leftDoorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(openProgress.value, [0, 1], [0, -width / 2]),
      },
    ],
  }));

  const rightDoorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(openProgress.value, [0, 1], [0, width / 2]),
      },
    ],
  }));

  const innerContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 0.8, 1], [0, 0.5, 1]),
  }));

  // ---------------------------
  // 메뉴 설정
  // ---------------------------
  const menuItems = [
    { label: "나의 냉장고", path: "/ingredients", icon: "nutrition", color: "#fca5a5" },
    { label: "레시피 추천", path: "/recipes", icon: "restaurant", color: "#fde047" },
    { label: "분리수거", path: "/waste-analysis", icon: "leaf", color: "#86efac" },
    { label: "마이페이지", path: "/mypage", icon: "person", color: "#93c5fd" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 내부 화면 */}
      <Animated.View style={[styles.innerContainer, innerContentStyle]}>
        <View style={styles.shelfHeader}>
          <View>
            <Text style={styles.welcomeText}>어서오세요! 무엇을 할까요?</Text>
            <Text style={styles.healthText}>
              Backend:{" "}
              {backendStatus === "idle"
                ? "체크 중..."
                : backendStatus === "ok"
                ? "연결됨 ✅"
                : "연결 실패 ❌"}
            </Text>
          </View>

          <TouchableOpacity onPress={toggleFridge} style={styles.closeBtn}>
            <Ionicons name="close-circle" size={30} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* 메뉴 그리드 */}
        <View style={styles.grid}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuCard, { backgroundColor: item.color + "20" }]}
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

      {/* 냉장고 문 */}
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

        {/* 문 열기 */}
        {!isOpen && (
          <TouchableOpacity style={styles.touchArea} onPress={toggleFridge}>
            <View style={styles.clickHint}>
              <Ionicons name="finger-print" size={40} color="rgba(255,255,255,0.6)" />
              <Text style={styles.clickText}>터치해서 열기</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ⭐ 유통기한 커스텀 알림 모달 */}
      <ExpiryAlertModal
        visible={expiryModalVisible}
        count={expiryCount}
        onClose={() => setExpiryModalVisible(false)}
        onGoIngredients={() => {
          setExpiryModalVisible(false);
          router.push("/ingredients");
        }}
      />

    </SafeAreaView>
  );
}

//
// -------------------------------
// 스타일
// -------------------------------
//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },

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
  },

  menuLabel: { fontSize: 16, fontWeight: "bold", color: "#e5e7eb" },
  footerText: {
    textAlign: "center",
    marginTop: 40,
    color: "#4b5563",
    fontSize: 12,
  },

  healthText: {
    marginTop: 8,
    fontSize: 12,
    color: "#9ca3af",
  },

  doorOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 10,
  },

  door: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    elevation: 10,
  },

  leftDoor: { borderRightWidth: 1, borderRightColor: "#94a3b8" },
  rightDoor: { borderLeftWidth: 1, borderLeftColor: "#94a3b8" },

  handleBar: {
    width: 8,
    height: 120,
    backgroundColor: "#94a3b8",
    borderRadius: 4,
    marginHorizontal: 10,
  },

  doorText: {
    position: "absolute",
    top: "40%",
    fontSize: 28,
    fontWeight: "900",
    color: "#94a3b8",
    opacity: 0.3,
    transform: [{ rotate: "-90deg" }],
  },

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

  clickText: {
    color: "white",
    marginTop: 10,
    fontWeight: "bold",
  },
});
