"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";
import { LoginForm } from "../login-form";

export default function TeacherLoginPage() {
  const { subdomain } = useParams();
  const t = useTranslations();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6">
      <div className="flex justify-center">
        <Image
          alt="logo"
          className="dark:invert"
          height={44}
          src="/logo-with-text.png"
          width={130}
        />
      </div>
      <div className="flex max-w-2xl flex-col justify-center rounded-lg p-6 shadow-sm border space-y-4">
        <h1 className="mb-1 text-2xl font-bold">
          {t("login.loginIntoTeacherAccount") || "Login into teacher account"}
        </h1>
        <p className="text-muted-foreground mb-4 text-sm">
          {t("login.loginIntoTeacherAccountDescription") ||
            "Login into your teacher account to access your platform"}
        </p>
        <LoginForm role="teacher" subdomain={subdomain as string} />
      </div>

      <p className="text-muted-foreground w-64 text-center text-sm">
        {t("auth.agreeTo")}{" "}
        <Link className="underline" href={"/terms"}>
          {t("auth.termsOfService")}
        </Link>{" "}
        {t("auth.and")}{" "}
        <Link className="underline" href={"/privacy"}>
          {t("auth.privacyPolicy")}
        </Link>
      </p>
    </div>
  );
}
