import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "auth";

/** 백엔드 UserOut과 동일 */
export type User = {
  id: number;
  email: string;
  name?: string;
};

export type AuthState = {
  accessToken: string;
  user: User;
};

export async function saveAuth(auth: AuthState) {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export async function getAuth(): Promise<AuthState | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearAuth() {
  await AsyncStorage.removeItem(AUTH_KEY);
}
