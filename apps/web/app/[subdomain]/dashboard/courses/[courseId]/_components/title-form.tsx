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
import { updateCourse } from "@/lib/courses";
import { attempt } from "@/lib/utils";

interface TitleFormProps {
  initialData: {
    title: string;
  };
  courseId: number;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

export const TitleForm = ({ initialData, courseId }: TitleFormProps) => {
  const [title, setTitle] = useState(initialData.title);
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");

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
        updateCourse(courseId, { title: values.title })
      );
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
      } else {
        setTitle(values.title);
        toast.success(tCommon("updatedSuccessfully"));
        toggleEdit();
        router.refresh();
      }
    } catch {
      toast.error(tCommon("somethingWentWrong"));
    }
  };

  return (
    <div className="bg-primary/5 rounded-lg border p-4">
      <div className="flex items-center justify-between font-medium">
        {t("courseTitle")}
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>
              <IconX className="mr-0.5 h-4 w-4" />
              {tCommon("cancel")}
            </>
          ) : (
            <>
              <IconPencil className="mr-0.5 h-4 w-4" />
              {tCommon("edit")}
            </>
          )}
        </Button>
      </div>
      {!isEditing && <p className="mt-2 text-sm">{title}</p>}
      {isEditing && (
        <Form {...form}>
          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting || !isValid}
                      placeholder={tCommon("titlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                {tCommon("save")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
