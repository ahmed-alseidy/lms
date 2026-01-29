import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getCurrentSession } from "@/lib/session";
import { Topbar } from "./topbar";

export default async function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentSession();
  if (
    !session ||
    !session.user ||
    session.user.role !== "student" ||
    (session.session.expiresAt &&
      new Date(session.session.expiresAt) < new Date())
  )
    redirect("/login");

  return (
    <div>
      <Topbar />
      <div className="mx-auto">{children}</div>
    </div>
  );
}
