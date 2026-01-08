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
import { Textarea } from "@/components/ui/textarea";
import { updateCourse } from "@/lib/courses";
import { attempt, cn } from "@/lib/utils";

interface DescriptionFormProps {
  initialData: { description: string };
  courseId: number;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

export const DescriptionForm = ({
  initialData,
  courseId,
}: DescriptionFormProps) => {
  const [description, setDescription] = useState(initialData.description);
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const [, error] = await attempt(
        updateCourse(courseId, { description: values.description })
      );
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
      } else {
        setDescription(values.description);
        toast.success(tCommon("updatedSuccessfully"));
        toggleEdit();
        router.refresh();
      }
    } catch {
      toast.error(tCommon("somethingWentWrong"));
    }
  };

  return (
    <div className="bg-primary/5 mt-6 rounded-lg border p-4">
      <div className="flex items-center justify-between font-medium">
        {t("courseDescription")}
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
      {!isEditing && (
        <p
          className={cn(
            "mt-2 text-sm",
            !description && "text-primary/50 italic"
          )}
        >
          {description || t("noDescriptionAvailable")}
        </p>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      {...field}
                      placeholder={tCommon("descriptionPlaceholder")}
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
