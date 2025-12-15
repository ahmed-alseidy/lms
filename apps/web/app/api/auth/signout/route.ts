import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/auth-fetch";
import { BACKEND_URL } from "@/lib/constants";
import { deleteSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const res = await authFetch(`${BACKEND_URL}/auth/logout`, {
    method: "POST",
  });
  if (res.status !== 200) return new NextResponse("Error logging out");

  await deleteSession();

  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  return NextResponse.redirect(new URL("/", req.nextUrl));
}
