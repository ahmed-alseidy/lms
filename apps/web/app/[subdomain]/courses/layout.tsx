import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { Topbar } from "./topbar";

export default async function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session || !session.user || session.user.role !== "student")
    redirect("/login");

  return (
    <div>
      <Topbar />
      <div className="mx-auto">{children}</div>
    </div>
  );
}
