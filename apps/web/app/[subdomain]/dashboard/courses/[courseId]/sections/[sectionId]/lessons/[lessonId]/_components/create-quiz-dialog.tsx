"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreateQuizDto } from "@lms-saas/shared-lib/dtos";
import { IconLoader, IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createQuiz, createQuizSchema, Quiz } from "@/lib/quizzes";
import { attempt } from "@/lib/utils";

type CreateQuizDialogProps = {
  lessonId: number;
  quizzesNumber: number;
  onQuizCreated: (quiz: Quiz) => void;
};

export const CreateQuizDialog = ({
  quizzesNumber,
  lessonId,
  onQuizCreated,
}: CreateQuizDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      duration: 0,
      allowMultipleAttempts: false,
    },
  });

  const tLessons = useTranslations("lessons");
  const tQuizzes = useTranslations("quizzes");
  const tCommon = useTranslations("common");

  const handleSubmit = async (data: CreateQuizDto) => {
    try {
      const [response, error] = await attempt(createQuiz(lessonId, data));
      if (error) {
        toast.error("Failed to create quiz");
        return;
      }

      onQuizCreated(response.data);
      setOpen(false);
      toast.success("Quiz created successfully");
    } catch (error) {
      toast.error("Failed to create quiz");
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild hidden={quizzesNumber >= 1}>
        <Button className="gap-2" hidden={quizzesNumber >= 1}>
          <IconPlus className="h-4 w-4" />
          {tCommon("create")} {tLessons("quiz")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tCommon("create")} {tLessons("quiz")}
          </DialogTitle>
          <DialogDescription>
            {tLessons("addNewQuizToTestYourStudentsKnowledge")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="mb-2 w-full space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="text-sm text-red-500">
              {form.formState.errors.root?.message}
            </div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("title")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tCommon("titlePlaceholder")}
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
                  <FormLabel>{tCommon("duration")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tCommon("durationPlaceholder")}
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {tQuizzes("allowMultipleAttempts") || "Allow Multiple Attempts"}
                    </FormLabel>
                    <p className="text-muted-foreground text-sm">
                      {tQuizzes("allowStudentsToRetakeQuiz") ||
                        "Allow students to retake this quiz multiple times"}
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? (
                  <div>
                    <IconLoader className="animate-spin" />
                    {tCommon("creating")}...
                  </div>
                ) : (
                  tCommon("create")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
