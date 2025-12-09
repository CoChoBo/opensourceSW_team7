// app/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getUser, saveUser } from "@/util/utils/auth"; // ✅ getUser 추가

export default function LoginScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 👉 로그인 버튼
  const handleLogin = async () => {
    if (!userId || !password) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      Alert.alert("로그인 실패", "아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }
    setError("");

    // ⚠️ 지금은 백엔드 없으니까 "입력만 되면 로그인 성공" 가정
    // 나중에 서버 붙이면 여기서 실제 로그인 API 호출하면 됨.

    // 🔥 핵심: 기존에 저장된 유저 정보가 있으면 email / nickname 유지
    const prev = await getUser();

    await saveUser({
      id: userId,
      nickname: prev?.nickname ?? userId, // 기존 닉네임 있으면 유지
      email: prev?.email,                 // ✅ 기존 이메일 유지
    });

    Alert.alert("로그인 성공", "냉장고로 이동합니다.", [
      {
        text: "확인",
        onPress: () => {
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  // 👉 회원가입 화면으로 이동
  const goToRegister = () => {
    setError("");
    router.push("/register");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* 상단 제목 영역 */}
          <View style={styles.header}>
            <Text style={styles.logoEmoji}>🥬</Text>
            <Text style={styles.title}>냉장고를 지켜줘</Text>
            <Text style={styles.subtitle}>
              아이디와 비밀번호를 입력하고 나의 냉장고에 로그인해 보세요.
            </Text>
          </View>

          {/* 입력 폼 */}
          <View style={styles.form}>
            {/* 아이디 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="id-card-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="아이디"
                placeholderTextColor="#6b7280"
                value={userId}
                onChangeText={setUserId}
                autoCapitalize="none"
              />
            </View>

            {/* 비밀번호 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* 버튼들 */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={goToRegister}
            >
              <Text style={styles.registerButtonText}>회원가입</Text>
            </TouchableOpacity>
          </View>

          {/* 푸터 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>LogMeal AI Fridge · v0.1</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "flex-start",
    gap: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  form: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 8,
  },
  input: {
    flex: 1,
    color: "#e5e7eb",
    fontSize: 14,
  },
  errorText: {
    color: "#f97316",
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  registerButton: {
    marginTop: 6,
    backgroundColor: "#111827",
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  registerButtonText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#6b7280",
  },
});
