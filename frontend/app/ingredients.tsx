import React, { useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { API_BASE_URL } from "@/constants/api";
import { getAuth } from "@/util/utils/auth";

export default function IngredientsScreen() {
  useEffect(() => {
    (async () => {
      const auth = await getAuth();
      console.log("AUTH:", auth);

      if (!auth) {
        console.log("❌ 로그인 안됨");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/ingredients`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      const data = await res.json();
      console.log("MY INGREDIENTS:", data);
    })();
  }, []);

  return (
    <SafeAreaView>
      <View>
        <Text>재료 확인 화면</Text>
        <Text>콘솔을 확인하세요</Text>
      </View>
    </SafeAreaView>
  );
}
