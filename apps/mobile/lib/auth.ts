import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "better-auth.session_token";

export async function signIn(
  email: string,
  password: string,
  role: "student" | "teacher"
) {
  const res = await axios.post(`${API_URL}/users/login`, {
    email,
    password,
    role,
  });
  const token = res.data.cookies?.[TOKEN_KEY];

  console.log(res.data.toString());
  if (!token) {
    throw new Error("No session token returned");
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
  return res.data;
}

export async function signOut() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}
