// app/register.tsx
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

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 👉 회원가입 버튼
  const handleRegister = () => {
  if (!email || !nickname || !userId || !password) {
    Alert.alert("회원가입 실패", "모든 정보를 입력해 주세요.");
    return;
  }

  // TODO: 나중에 여기서 서버에 회원가입 요청 보내기
  // const res = await signUpAPI({ email, nickname, userId, password });
  // if (!res.ok) { Alert.alert("회원가입 실패", res.message); return; }

  Alert.alert("회원가입 완료", "이제 로그인 화면으로 이동합니다.", [
    {
      text: "확인",
      onPress: () => {
        // 회원가입 후 로그인 화면으로 이동
        router.replace("/login");
      },
    },
  ]);
};

  // 👉 다시 로그인으로 돌아가기
  const goToLogin = () => {
    router.replace("/login");
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
              회원가입을 하고 나의 냉장고를 관리해 보세요.
            </Text>
          </View>

          {/* 입력 폼 (캡처처럼 4개 필드) */}
          <View style={styles.form}>
            {/* 이메일 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* 닉네임 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="닉네임"
                placeholderTextColor="#6b7280"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

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
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleRegister}
            >
              <Text style={styles.loginButtonText}>회원가입</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={goToLogin}
            >
              <Text style={styles.registerButtonText}>로그인으로 돌아가기</Text>
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
