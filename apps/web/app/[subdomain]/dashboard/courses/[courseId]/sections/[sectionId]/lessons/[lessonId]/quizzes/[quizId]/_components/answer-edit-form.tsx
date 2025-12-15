"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconPencil, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateAnswer } from "@/lib/quizzes";
import { attempt } from "@/lib/utils";

interface AnswerEditFormProps {
  initialData: {
    answerText: string;
  };
  answerId: number;
}

const formSchema = z.object({
  answerText: z.string().min(1, {
    message: "Answer is required",
  }),
});

export const AnswerEditForm = ({
  initialData,
  answerId,
}: AnswerEditFormProps) => {
  const [answerText, setAnswerText] = useState(initialData.answerText);
  const [isEditing, setIsEditing] = useState(false);

  const t = useTranslations();

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const [, error] = await attempt(
        updateAnswer(answerId, { answerText: values.answerText })
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      setAnswerText(values.answerText);
      toast.success(t("quizzes.answerUpdatedSuccessfully"));
      toggleEdit();
      router.refresh();
    } catch {
      toast.error(t("common.somethingWentWrong"));
    }
  };

  return (
    <div className="bg-primary/5 min-w-[300px] rounded-lg border p-4">
      <div className="flex items-center justify-between font-medium">
        {t("quizzes.answer")}
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>
              <IconX className="mr-0.5 h-4 w-4" />
              {t("common.cancel")}
            </>
          ) : (
            <>
              <IconPencil className="mr-0.5 h-4 w-4" />
              {t("common.edit")}
            </>
          )}
        </Button>
      </div>
      {!isEditing && <p className="mt-2 text-sm">{answerText}</p>}
      {isEditing && (
        <Form {...form}>
          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="answerText"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder={t("common.titlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
