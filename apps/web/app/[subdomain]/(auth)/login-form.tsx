"use client";

import { classValidatorResolver } from "@hookform/resolvers/class-validator";
import { LoginUserDto } from "@lms-saas/shared-lib/dtos";
import { IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginUser } from "@/lib/auth";

export function LoginForm({
  subdomain,
  role,
}: {
  subdomain: string;
  role: string;
}) {
  const router = useRouter();
  const t = useTranslations();

  const resolver = useMemo(() => {
    return classValidatorResolver(LoginUserDto);
  }, []);

  const form = useForm<LoginUserDto>({
    resolver,
    defaultValues: {
      email: "",
      password: "",
      role,
    },
    mode: "onChange",
  });

  const { isSubmitting, isValid } = form.formState;

  async function onSubmit(data: LoginUserDto) {
    data.subdomain = subdomain;
    const res = await loginUser(data);
    if (res?.status !== 200)
      form.setError("root", { message: res?.data.message });
    else {
      if (role === "teacher") router.replace("/dashboard/courses");
      else router.replace("/courses");
    }
  }

  return (
    <Form {...form}>
      <form
        className="mb-2 w-full space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="text-sm text-red-500">
          {form.formState.errors.root?.message}
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.email")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("login.emailPlaceholder")}
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.password")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("login.passwordPlaceholder")}
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="w-full"
          disabled={isSubmitting || !isValid}
          type="submit"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("login.signingIn")}
            </span>
          ) : (
            t("login.signIn")
          )}
        </Button>
      </form>
    </Form>
  );
}
