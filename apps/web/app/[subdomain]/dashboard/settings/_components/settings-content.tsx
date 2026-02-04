"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type TeacherProfile = {
  subdomain: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  contactInfo: string | null;
};

type SessionUser = {
  name: string;
  email: string;
  image: string | null;
};

type SettingsContentProps = {
  user: SessionUser;
  teacherProfile: TeacherProfile | null;
};

function getPlatformUrl(subdomain: string) {
  if (typeof window !== "undefined") {
    const host = window.location.host;
    const base = host.replace(/^[^.]+\./, ""); // e.g. localhost:3000
    return `${window.location.protocol}//${subdomain}.${base}`;
  }
  return `${subdomain}.localhost:3000`;
}

export function SettingsContent({
  user,
  teacherProfile,
}: SettingsContentProps) {
  const t = useTranslations("settings");
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");

  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {tNav("profile")} &amp; {t("account").toLowerCase()}
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
            <CardDescription>{t("profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage alt={user.name} src={user.image ?? undefined} />
                <AvatarFallback className="text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="font-medium leading-none">{user.name}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              {tCommon("pressEditToSeeDetails")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("platform")}</CardTitle>
            <CardDescription>{t("platformDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {teacherProfile ? (
              <>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">
                    {t("yourSubdomain")}
                  </p>
                  <p className="font-mono font-medium">
                    {teacherProfile.subdomain}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("subdomainDescription")} —{" "}
                  <span className="font-mono text-foreground">
                    {getPlatformUrl(teacherProfile.subdomain)}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{t("comingSoon")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("account")}</CardTitle>
            <CardDescription>{t("accountDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{t("changePassword")}</p>
                <p className="text-muted-foreground text-sm">
                  {t("comingSoon")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
