import {
  CreateStudentDto,
  CreateTeacherDto,
  LoginUserDto,
} from "@lms-saas/shared-lib/dtos";
import axios, { AxiosError } from "axios";
import { BACKEND_URL } from "./constants";
import {
  deleteSession,
  getCurrentSession,
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

export async function getCurrentSessionClient() {
  return await getCurrentSession();
}