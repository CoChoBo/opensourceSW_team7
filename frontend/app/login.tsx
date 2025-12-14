import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE_URL } from "@/constants/api";
import { saveAuth, getAuth } from "@/util/utils/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("로그인 실패", "이메일/비밀번호 입력");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        Alert.alert("로그인 실패", "이메일 또는 비밀번호 오류");
        return;
      }

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      await saveAuth({
        accessToken: data.access_token,
        user: data.user,
      });

      const auth = await getAuth();
      console.log("SAVED AUTH:", auth);

      router.replace("/ingredients"); // 확인용 이동
    } catch {
      Alert.alert("에러", "서버 연결 실패");
    }
  };

  return (
    <SafeAreaView>
      <View>
        <Text>로그인</Text>

        <TextInput placeholder="이메일" value={email} onChangeText={setEmail} />
        <TextInput
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={handleLogin}>
          <Text>로그인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
