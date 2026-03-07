import * as SecureStore from "expo-secure-store";
export type User = {
  _id: string;
  fullName: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

const TOKEN_KEY = "reform_token";
const USER_KEY = "reform_user";

export async function saveAuth(token: string, user: User) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getUser() {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
