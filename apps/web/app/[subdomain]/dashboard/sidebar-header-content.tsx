"use client";

import { IconBook, IconChartBar, IconSettings } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function SidebarHeaderContent() {
  const t = useTranslations("sidebar");
  const path = usePathname();
  return (
    <>
      <SidebarHeader className="p-3 text-xl font-bold">
        <div className="flex items-center justify-between">
          <Image
            alt="logo"
            className="dark:invert"
            height={30}
            src="/logo-with-text.png"
            width={100}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-1">
        <SidebarGroup>
          <SidebarGroupLabel>{t("items")}</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenuItem className="list-none">
              <SidebarMenuButton
                asChild
                className={
                  path.includes("/dashboard/courses")
                    ? `text-primary-foreground hover:text-primary-foreground bg-primary hover:bg-primary`
                    : `hover:text-primary/90 hover:bg-accent`
                }
              >
                <Link href="/dashboard/courses" replace={true}>
                  <IconBook className="opacity-90" />
                  <span>{t("courses")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="list-none">
              <SidebarMenuButton
                asChild
                className={
                  path.includes("/dashboard/analytics")
                    ? `text-primary-foreground hover:text-primary-foreground bg-primary hover:bg-primary`
                    : `hover:text-primary/90 hover:bg-accent`
                }
              >
                <Link href="/dashboard/analytics" replace={true}>
                  <IconChartBar className="opacity-90" />
                  <span>{t("analytics")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="list-none">
              <SidebarMenuButton
                asChild
                className={
                  path.includes("/dashboard/settings")
                    ? `text-primary-foreground hover:text-primary-foreground bg-primary hover:bg-primary`
                    : `hover:text-primary/90 hover:bg-accent`
                }
              >
                <Link href="/dashboard/settings" replace={true}>
                  <IconSettings className="opacity-90" />
                  <span>{t("settings")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
