import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";
import { LowerSidebar } from "./courses/_components/lower-sidebar";
import SidebarHeaderContent from "./sidebar-header-content";

export default async function DashboardLayout({
  children,
  params,
}: PropsWithChildren<{ params: { subdomain: string } }>) {
  const session = await getSession();
  console.log(session);
  if (
    !session ||
    !session.user ||
    session.user.role !== "teacher" ||
    session.user.subdomain !== params.subdomain
  )
    redirect("/login-teacher");

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ar";
  const side = locale === "ar" ? "right" : "left";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar dir={dir} side={side} variant="floating">
          <SidebarHeaderContent />
          <LowerSidebar user={session.user} />
        </Sidebar>
        <div className="w-full">
          <SidebarTrigger className="mt-1" />
          <div className="w-full px-4 py-1">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
