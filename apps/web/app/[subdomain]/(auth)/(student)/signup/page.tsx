"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useTransition } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  const { subdomain } = useParams();

  const t = useTranslations();

  return (
    <div className="flex w-full items-center justify-center">
      <div className="bg-primary text-primary-foreground hidden min-h-screen w-1/2 flex-col justify-between p-12 md:flex">
        <h3 className="text-2xl font-bold">{t("signup.title")}</h3>
        <p className="text-muted w-4/5">{t("signup.description")}</p>
      </div>
      <div className="flex w-10/12 justify-center md:w-1/2">
        <div className="w-80 space-y-2">
          <div className="mb-6 flex justify-center">
            <Image
              alt="logo"
              className="dark:invert"
              height={44}
              src="/logo-with-text.png"
              width={130}
            />
          </div>
          <h1 className="text-center text-2xl font-bold">
            {t("signup.title")}
          </h1>
          <SignupForm subdomain={subdomain as string} />
          <div className="mt-2 flex justify-between text-sm">
            <p>{t("signup.alreadyHaveAccount")}</p>
            <Link className="underline" href={"/login"}>
              {t("signup.signIn")}
            </Link>
          </div>

          <p className="text-muted-foreground text-center text-sm">
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
      </div>
    </div>
  );
}
