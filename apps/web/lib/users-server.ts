import { cookies } from "next/headers";
import { BACKEND_URL } from "./constants";

const baseUrl = BACKEND_URL + "/users";

export type TeacherProfile = {
  subdomain: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  contactInfo: string | null;
};

/** Server-only: get current teacher profile (subdomain, etc.) using request cookies. */
export async function getTeacherProfileServer(): Promise<TeacherProfile | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const res = await fetch(`${baseUrl}/teacher-profile`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
