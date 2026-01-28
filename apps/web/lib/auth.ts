import {
  CreateStudentDto,
  CreateTeacherDto,
  LoginUserDto,
} from "@lms-saas/shared-lib/dtos";
import axios, { AxiosError } from "axios";
import { BACKEND_URL } from "./constants";
import {
  deleteSession,
  getHeaders,
  setBetterAuthCookieToken,
  updateTokens,
} from "./session";
import { attempt } from "./utils";

const baseUrl = `${BACKEND_URL}/auth`;

export async function signupTeacher(input: CreateTeacherDto) {
  try {
    return await axios.post(`${BACKEND_URL}/users/teacher/register`, input);
  } catch (error) {
    console.log(error);
    if (error instanceof AxiosError) return error.response;
  }
}

export async function loginUser(input: LoginUserDto) {
  try {
    const res = await axios.post(`${BACKEND_URL}/users/login`, input);
    console.log(res.data);
    const cookies = res.data.cookies;
    console.log(cookies);

    await setBetterAuthCookieToken(cookies);

    return res;
  } catch (error) {
    console.log(error);
    if (error instanceof AxiosError) return error.response;
  }
}

export async function refreshToken(
  oldRefreshToken: string
): Promise<string | null> {
  try {
    const res = await axios.post(
      "refresh-token",
      { refreshToken: oldRefreshToken },
      { baseURL: baseUrl }
    );

    const { accessToken, refreshToken: newRefreshToken } = res.data;

    const [_, error] = await attempt(
      updateTokens({
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
    if (error) {
      console.error("Failed to update tokens on the server");
      return null;
    }

    return accessToken;
  } catch (error) {
    // Unified error handling
    console.error(
      "Error refreshing token:",
      error instanceof AxiosError
        ? error.response?.data || error.message
        : error
    );
    return null;
  }
}

export async function signupStudent(input: CreateStudentDto) {
  try {
    return await axios.post(`${BACKEND_URL}/users/student/register`, input);
  } catch (error) {
    console.log(error);
    if (error instanceof AxiosError) return error.response;
  }
}

export async function logout() {
  await deleteSession();
}

export async function getCurrentSession() {
  try {
    const headersList = await getHeaders();
    const cookieHeader = headersList.get("cookie") || "";
    console.log("cookieHeader", cookieHeader);
    const res = await axios.get<{
      session: {
        expiresAt: string;
        token: string;
        createdAt: string;
        updatedAt: string;
        ipAddress: string;
        userAgent: string;
        userId: string;
        id: string;
      };
      user: {
        name: string;
        email: string;
        emailVerified: boolean;
        image: string | null;
        createdAt: string;
        updatedAt: string;
        role: "teacher" | "student";
        id: string;
      };
    }>(`${BACKEND_URL}/users/session`, {
      headers: { cookie: cookieHeader },
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.log(error);
    if (error instanceof AxiosError) return null;
  }
}
