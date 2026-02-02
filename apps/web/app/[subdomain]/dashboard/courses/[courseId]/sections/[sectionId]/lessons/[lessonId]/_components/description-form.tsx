"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconPencil, IconX } from "@tabler/icons-react";
import purify from "dompurify";
import { SerializedEditorState } from "lexical";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Editor } from "@/components/blocks/editor-00/editor";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { updateLesson } from "@/lib/courses";
import { lexicalToHtml } from "@/lib/lexical-to-html";
import { attempt } from "@/lib/utils";

interface DescriptionFormProps {
  initialData: SerializedEditorState;
  courseId: number;
  sectionId: number;
  lessonId: number;
}

const formSchema = z.object({
  description: z
    .any()
    .refine((val) => val !== undefined, "Description is required"),
});

const initialValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "\n",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

export const DescriptionForm = ({
  initialData,
  courseId,
  sectionId,
  lessonId,
}: DescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const t = useTranslations("lessons");
  const tCommon = useTranslations("common");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData || initialValue,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const [, error] = await attempt(
        updateLesson(courseId, sectionId, lessonId, {
          description: JSON.stringify(values.description),
        })
      );
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
      } else {
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
        {t("lessonDescription")}
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
          className="mt-2 text-sm text-balance break-all whitespace-normal"
          dangerouslySetInnerHTML={{
            __html: purify.sanitize(
              lexicalToHtml(
                form.getValues("description") || tCommon("noDescription")
              )
            ),
          }}
        />
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
                    <Editor
                      editorSerializedState={field.value}
                      onSerializedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex w-full items-center justify-end gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
