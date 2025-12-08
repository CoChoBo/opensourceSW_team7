import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>

        {/* ---- 탭 그룹 (헤더 없음) ---- */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />

        {/* ---- 개별 화면: 뒤로가기 표시됨 ---- */}
        <Stack.Screen 
          name="camera"
          options={{
            title: "이미지 분석(카메라)",
            headerBackTitle: "뒤로가지",
          }}
        />

        <Stack.Screen 
          name="ingredients"
          options={{
            title: "식재료 관리",
            headerBackTitle: "뒤로가지",
          }}
        />

        <Stack.Screen 
          name="expiry"
          options={{
            title: "소비기한 알림",
            headerBackTitle: "뒤로가지",
          }}
        />

        <Stack.Screen 
          name="recipes"
          options={{
            title: "레시피 추천",
            headerBackTitle: "뒤로가지",
          }}
        />

        <Stack.Screen 
          name="waste-analysis"
          options={{
            title: "음식물 쓰레기 분석",
            headerBackTitle: "뒤로가지",
          }}
        />

        <Stack.Screen 
          name="guide"
          options={{
            title: "환경/분리배출 가이드",
            headerBackTitle: "뒤로가지",
          }}
        />

        <Stack.Screen 
          name="mypage"
          options={{
            title: "마이페이지(포인트)",
            headerBackTitle: "뒤로가지",
          }}
        />

        {/* 기본 modal 화면 */}
        <Stack.Screen 
          name="modal" 
          options={{ presentation: 'modal', title: 'Modal' }} 
        />

      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
