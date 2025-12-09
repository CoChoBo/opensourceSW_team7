// app/index.tsx
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getUser } from "../utils/auth"; // 

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const user = await getUser();
      setHasUser(!!user);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) {
    // 잠깐 로딩 화면 (스플래시 느낌)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#020617",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 유저가 있으면 바로 탭, 없으면 로그인
  if (hasUser) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}
