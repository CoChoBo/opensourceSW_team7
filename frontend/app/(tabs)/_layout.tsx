import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native'; // 리액트 네이티브 기본 훅 사용

export default function TabLayout() {
  // 다크 모드인지 확인
  const colorScheme = useColorScheme();
  
  // 색상 직접 정의 (파일 불러오기 에러 방지)
  const activeColor = colorScheme === 'dark' ? '#fff' : '#2f95dc'; // 다크모드면 흰색, 아니면 파란색
  const inactiveColor = colorScheme === 'dark' ? '#888' : '#888';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor, // 활성 탭 색상
        tabBarInactiveTintColor: inactiveColor, // 비활성 탭 색상
        headerShown: false,
        tabBarStyle: {
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
            backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff', // 탭 바 배경색
            borderTopWidth: 0, // 상단 테두리 제거 (깔끔하게)
        },
        tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginBottom: 5,
        }
      }}>

      {/* 1. 홈 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* 2. 나의 냉장고 */}
      <Tabs.Screen
        name="ingredients"
        options={{
          title: '나의 냉장고',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'nutrition' : 'nutrition-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* 3. 레시피 */}
      <Tabs.Screen
        name="recipes"
        options={{
          title: '레시피',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* 4. 에코 관리 */}
      <Tabs.Screen
        name="waste-analysis"
        options={{
          title: '분리수거',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* 5. 마이페이지 */}
      <Tabs.Screen
        name="mypage"
        options={{
          title: 'MY',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* 숨김 처리된 탭들 */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
