import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE_URL } from "@/constants/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !name || !password) {
      Alert.alert("회원가입 실패", "모든 정보를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        Alert.alert("회원가입 실패", err?.detail ?? "알 수 없는 오류");
        return;
      }

      Alert.alert("회원가입 완료", "이제 로그인할 수 있어요.", [
        { text: "확인", onPress: () => router.replace("/login") },
      ]);
    } catch {
      Alert.alert("에러", "서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>
            간단한 정보로 나만의 냉장고를 만들어보세요
          </Text>
        </View>

        {/* 입력 폼 */}
        <View style={styles.form}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            placeholder="홍길동"
            placeholderTextColor="#6b7280"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="8자 이상 입력하세요"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "처리 중..." : "회원가입"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/login")}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              이미 계정이 있나요? 로그인
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    padding: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  form: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    padding: 14,
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  link: {
    marginTop: 18,
    alignItems: "center",
  },
  linkText: {
    color: "#9ca3af",
    fontSize: 13,
  },
});
