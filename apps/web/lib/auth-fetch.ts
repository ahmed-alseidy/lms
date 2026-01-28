"use client";

import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { authClient } from "./auth-client";
import { BACKEND_URL } from "./constants";

export type OkResponse<T = unknown> = {
  ok: true;
  data: T;
};

export async function authFetch<T>(
  url: string | URL,
  options?: AxiosRequestConfig
): Promise<AxiosResponse<OkResponse<T>>> {
  const urlString = url.toString();

  // Check if the URL is pointing to the backend
  const isBackendUrl = urlString.startsWith(BACKEND_URL);

  // If it's a backend URL, proxy through Next.js API route to include cookies
  // This is necessary because cookies from localhost:3000 won't be sent to localhost:3001
  const targetUrl = isBackendUrl
    ? `/api/proxy?url=${encodeURIComponent(urlString)}`
    : urlString;

  const config: AxiosRequestConfig = {
    ...options,
    withCredentials: true,
    url: targetUrl,
    headers: {
      ...options?.headers,
    },
  };

  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    console.log("error", error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await authClient.signOut();
      throw new Error("UNAUTHORIZED");
    }

    console.error("Request failed:", error);
    throw error;
  }
}
