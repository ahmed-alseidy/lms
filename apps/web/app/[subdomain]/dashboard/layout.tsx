import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import LanguageSwitcher from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getCurrentSession } from "@/lib/session";
import { LowerSidebar } from "./courses/_components/lower-sidebar";
import SidebarHeaderContent from "./sidebar-header-content";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const session = await getCurrentSession();
  if (
    !session ||
    !session.user ||
    session.user.role !== "teacher" ||
    (session.session?.expiresAt &&
      new Date(session.session.expiresAt) < new Date())
  ) {
    redirect("/login-teacher");
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ar";
  const side = locale === "ar" ? "right" : "left";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar dir={dir} side={side} variant="sidebar">
          <SidebarHeaderContent />
          <LowerSidebar user={session.user} />
        </Sidebar>
        <div className="w-full">
          <header className="pt-4 md:px-6 px-2">
            <div className="flex items-center justify-between">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ModeToggle />
              </div>
            </div>
          </header>
          <div className="w-full px-4 py-1">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
