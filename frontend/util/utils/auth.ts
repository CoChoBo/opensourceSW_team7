// utils/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "loggedInUser";

export type LoggedInUser = {
  id: string;        // 아이디
  nickname: string;  // 닉네임 (지금은 임시로라도 저장)
  email?: string;
};

// 유저 저장
export async function saveUser(user: LoggedInUser) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

// 유저 불러오기
export async function getUser(): Promise<LoggedInUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 유저 삭제(로그아웃용)
export async function clearUser() {
  await AsyncStorage.removeItem(USER_KEY);
}
