"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconPencil, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { updateQuiz } from "@/lib/quizzes";
import { attempt } from "@/lib/utils";

interface QuizSettingsFormProps {
  initialData: {
    title: string;
    duration: number;
    allowMultipleAttempts: boolean;
  };
  quizId: string;
  lessonId: number;
}

const formSchema = z.object({
  title: z
    .string()
    .min(1, {
      message: "Title is required",
    })
    .min(3, {
      message: "Title must be at least 3 characters",
    })
    .max(255, {
      message: "Title must be at most 255 characters",
    }),
  duration: z.coerce
    .number()
    .min(1, {
      error: "Duration is required",
    })
    .max(120, {
      message: "Duration must be at most 120 minutes",
    }),
  allowMultipleAttempts: z.boolean().default(false),
});

export const QuizSettingsForm = ({
  initialData,
  quizId,
  lessonId,
}: QuizSettingsFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState(initialData);
  const router = useRouter();
  const t = useTranslations();
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      duration: initialData.duration,
      allowMultipleAttempts: initialData.allowMultipleAttempts ?? false,
    },
    mode: "onChange",
  });

  const { isSubmitting, isValid } = form.formState;

  // Sync form with settings when entering edit mode
  useEffect(() => {
    if (isEditing) {
      form.reset({
        title: settings.title,
        duration: settings.duration,
        allowMultipleAttempts: settings.allowMultipleAttempts,
      });
    }
  }, [isEditing, settings, form]);

  const toggleEdit = () => {
    if (isEditing) {
      // Reset form to current settings when canceling (discard unsaved changes)
      form.reset({
        title: settings.title,
        duration: settings.duration,
        allowMultipleAttempts: settings.allowMultipleAttempts,
      });
    }
    // When entering edit mode, useEffect will handle resetting the form
    setIsEditing((current) => !current);
  };

  const onSubmit = async (values: {
    title: string;
    duration: number;
    allowMultipleAttempts: boolean;
  }) => {
    try {
      const [, error] = await attempt(
        updateQuiz(lessonId, quizId, {
          title: values.title,
          duration: values.duration,
          allowMultipleAttempts: values.allowMultipleAttempts,
        })
      );

      if (error) {
        toast.error(tCommon("somethingWentWrong") || "Failed to update quiz");
        return;
      }

      const updatedSettings = {
        title: values.title,
        duration: values.duration,
        allowMultipleAttempts: values.allowMultipleAttempts,
      };
      setSettings(updatedSettings);
      form.reset(updatedSettings);
      toast.success(
        tCommon("updatedSuccessfully") || "Quiz updated successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard-quiz", quizId] });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(tCommon("somethingWentWrong") || "Failed to update quiz");
    }
  };

  return (
    <div className="bg-primary/5 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {t("quizzes.quizSettings") || "Quiz Settings"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t("quizzes.manageQuizProperties") ||
              "Manage quiz title, duration, and attempt settings"}
          </p>
        </div>
        <Button onClick={toggleEdit} size="sm" variant="ghost">
          {isEditing ? (
            <>
              <IconX className="mr-2 h-4 w-4" />
              {tCommon("cancel")}
            </>
          ) : (
            <>
              <IconPencil className="mr-2 h-4 w-4" />
              {tCommon("edit")}
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">
              {tCommon("title")}:
            </span>
            <span className="font-medium">{settings.title}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">
              {tCommon("duration")}:
            </span>
            <span className="font-medium">
              {settings.duration} {tCommon("minutes")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">
              {t("quizzes.multipleAttempts") || "Multiple Attempts"}:
            </span>
            <span className="font-medium">
              {settings.allowMultipleAttempts
                ? tCommon("enabled") || "Enabled"
                : tCommon("disabled") || "Disabled"}
            </span>
          </div>
        </div>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            className="mt-6 space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("title")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder={
                        tCommon("titlePlaceholder") || "Enter quiz title"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {tCommon("duration")} ({tCommon("minutes")})
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      min="1"
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === "" ? undefined : Number(value)
                        );
                      }}
                      placeholder={
                        tCommon("durationPlaceholder") || "Enter duration"
                      }
                      ref={field.ref}
                      type="number"
                      value={typeof field.value === "number" ? field.value : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowMultipleAttempts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={isSubmitting}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t("quizzes.allowMultipleAttempts") ||
                        "Allow Multiple Attempts"}
                    </FormLabel>
                    <p className="text-muted-foreground text-sm">
                      {t("quizzes.allowStudentsToRetakeQuiz") ||
                        "Allow students to retake this quiz multiple times"}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                {isSubmitting
                  ? tCommon("submitting") || "Submitting..."
                  : tCommon("save")}
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={toggleEdit}
                type="button"
                variant="outline"
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
