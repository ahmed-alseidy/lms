"use client";

import { classValidatorResolver } from "@hookform/resolvers/class-validator";
import { CreateStudentDto } from "@lms-saas/shared-lib/dtos";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";
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
import { signupStudent } from "@/lib/auth";
import { attempt } from "@/lib/utils";

export function SignupForm({ subdomain }: { subdomain: string }) {
  const router = useRouter();
  const t = useTranslations();

  const resolver = useMemo(() => {
    return classValidatorResolver(CreateStudentDto);
  }, []);

  const form = useForm<CreateStudentDto>({
    resolver,
    defaultValues: {
      email: "",
      name: "",
      password: "",
      teacherSubdomain: "",
    },
  });

  form.setValue("teacherSubdomain", subdomain);

  async function onSubmit(data: CreateStudentDto) {
    const [, error] = await attempt(signupStudent(data));
    if (error) {
      form.setError("root", { message: error.message });
    } else {
      router.push("/login");
    }
  }

  return (
    <Form {...form}>
      <form
        className="mb-3 w-full space-y-3"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="text-sm text-red-500">
          {form.formState.errors.root?.message}
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("signup.username")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("signup.usernamePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("signup.email")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("signup.emailPlaceholder")}
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
              <FormLabel>{t("signup.password")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("signup.passwordPlaceholder")}
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full">{t("signup.signUp")}</Button>
      </form>
    </Form>
  );
}
