"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconImageInPicture,
  IconLoader2,
  IconPencil,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
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
import { uploadCoverImage } from "@/lib/courses";
import { attempt } from "@/lib/utils";

interface ImageFormProps {
  initialData: {
    imageUrl: string;
  };
  courseId: number;
}

const formSchema = z.object({
  coverImage: z.instanceof(File),
});

export const ImageForm = ({ initialData, courseId }: ImageFormProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coverImage: undefined,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const [, error] = await attempt(
        uploadCoverImage(courseId, values.coverImage)
      );
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
      } else {
        queryClient.invalidateQueries({
          queryKey: ["dashboard-course", courseId],
        });
        toast.success(tCommon("updatedSuccessfully"));
        toggleEdit();
        router.refresh();
      }
    } catch {
      toast.error(tCommon("somethingWentWrong"));
    }
  };

  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-primary/5 mt-6 rounded-lg border p-4">
      <div className="flex items-center justify-between font-medium">
        {t("courseImage")}
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && (
            <>
              <IconX className="mr-0.5 h-4 w-4" />
              {tCommon("cancel")}
            </>
          )}
          {!isEditing && !initialData.imageUrl && (
            <>
              <IconPlus className="mr-0.5 h-4 w-4" />
              {tCommon("add")}
            </>
          )}
          {!isEditing && initialData.imageUrl && (
            <>
              <IconPencil className="mr-0.5 h-4 w-4" />
              {tCommon("edit")}
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.imageUrl ? (
          <div className="flex h-60 items-center justify-center rounded-md bg-primary/10">
            <IconImageInPicture className="h-10 w-10 text-primary" />
          </div>
        ) : (
          <div className="relative mt-2 aspect-video h-10/12 w-full overflow-hidden">
            <Image
              alt="Upload"
              className="rounded-md object-cover"
              fill
              src={initialData.imageUrl}
            />
          </div>
        ))}
      {isEditing && (
        <Form {...form}>
          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field: { onChange, ref, value, ...fieldProps } }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      accept="image/*"
                      disabled={isSubmitting}
                      onChange={(event) => onChange(event.target.files?.[0])}
                      placeholder="e.g. 'Advanced web development'"
                      ref={fileRef}
                      type="file"
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                {isSubmitting && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {tCommon("save")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
