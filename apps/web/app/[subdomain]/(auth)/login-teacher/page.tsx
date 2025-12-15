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
      <div className="flex w-96 flex-col items-center justify-center rounded-lg border-1 p-6 shadow-sm">
        <div className="w-full">
          <h1 className="mb-1 text-2xl font-bold">{t("login.title")}</h1>
          <p className="text-muted-foreground mb-4 text-sm">
            {t("login.description")}
          </p>
          <LoginForm role="teacher" subdomain={subdomain as string} />
        </div>
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
