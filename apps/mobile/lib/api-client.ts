import axios from "axios";
import { getStoredToken } from "./auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers["Cookie"] = `better-auth.session_token=${token}`;
  }
  return config;
});
