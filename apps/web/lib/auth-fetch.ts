import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { refreshToken } from "./auth";
import { getSession } from "./session";

export async function authFetch<T>(
  url: string | URL,
  options?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const session = await getSession();

  // Prepare the headers with Authorization if accessToken exists
  const authHeaders = session?.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};

  const config: AxiosRequestConfig = {
    ...options,
    headers: {
      ...options?.headers,
      ...authHeaders,
    },
    url: url.toString(),
  };

  try {
    // Attempt the request
    const response = await axios(config);
    return response;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      session?.refreshToken
    ) {
      console.warn("Access token expired. Attempting to refresh token...");

      const newAccessToken = await refreshToken(session.refreshToken);

      if (newAccessToken) {
        // Retry the request with the new token
        const retryConfig: AxiosRequestConfig = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        };

        try {
          return await axios(retryConfig);
        } catch (retryError) {
          console.error("Retry after refresh failed:", retryError);
          throw retryError;
        }
      }
    }

    // Rethrow the error if it's not recoverable
    console.error("Request failed:", error);
    throw error;
  }
}
