"use server";

import axios, { AxiosError } from "axios";
import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BACKEND_URL } from "./constants";

export type Session = {
  user: {
    id: number;
    name: string;
    role: "teacher" | "student";
    subdomain: string | null;
  };
  accessToken: string;
  refreshToken: string;
};

const secretKey = process.env.SESSION_SECRET_KEY;
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(payload: Session) {
  const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // we want the date in millisecond

  const session = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiredAt)
    .sign(encodedKey);

  (await cookies()).set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiredAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function setBetterAuthCookieToken(
  c: Record<string, string | boolean>
) {
  if (!c) return;

  let token = c["better-auth.session_token"] as string | undefined;
  if (!token) return;

  // Decode once so we don't double-encode: the value from the API's Set-Cookie
  // is already %-encoded (%2B, %2F, %3D). cookies().set can encode again → %252B
  // etc. Better Auth then decodes once, gets the wrong string, signature fails.
  try {
    token = decodeURIComponent(token);
  } catch {
    // keep as-is if malformed
  }

  (await cookies()).set("better-auth.session_token", token, {
    httpOnly: (c["HttpOnly"] as boolean) ?? true,
    secure: (c["Secure"] as boolean) ?? process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 days
    sameSite: (c["SameSite"] as "lax" | "strict" | "none") ?? "lax",
    path: (c["Path"] as string) ?? "/",
  });
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

export async function getSession() {
  const cookie = (await cookies()).get("session")?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as Session;
  } catch (error) {
    console.error("Failed to verify the session", error);
    redirect("/auth/signin");
  }
}

export async function deleteSession() {
  (await cookies()).delete("better-auth.session_token");
}

export async function updateTokens({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}) {
  const cookie = (await cookies()).get("session")?.value;
  if (!cookie) return null;

  const { payload } = await jwtVerify<Session>(cookie, encodedKey);
  if (!payload) throw new Error("Session not found!");

  const newPayload: Session = {
    user: payload.user,
    accessToken,
    refreshToken,
  };

  await createSession(newPayload);
}

export async function getHeaders() {
  return await headers();
}
