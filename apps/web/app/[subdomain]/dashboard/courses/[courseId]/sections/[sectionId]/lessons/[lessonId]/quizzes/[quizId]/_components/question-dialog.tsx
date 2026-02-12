import { classValidatorResolver } from "@hookform/resolvers/class-validator";
import { CreateQuizQuestionDto } from "@lms-saas/shared-lib/dtos";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { Dispatch, SetStateAction, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createQuestion, QuizQuestion } from "@/lib/quizzes";
import { attempt } from "@/lib/utils";

type QuestionDialogProps = {
  quizId: string;
  questionLength: number;
  question?: QuizQuestion;
  setQuestions: Dispatch<SetStateAction<QuizQuestion[]>>;
  onQuestionCreated?: (question: QuizQuestion) => void;
  onQuestionUpdated?: (question: QuizQuestion) => void;
  trigger?: React.ReactNode;
};

export const QuestionDialog = ({
  questionLength,
  quizId,
  setQuestions,
  trigger,
}: QuestionDialogProps) => {
  const resolver = useMemo(() => {
    return classValidatorResolver(CreateQuizQuestionDto);
  }, []);

  const t = useTranslations();

  const form = useForm<CreateQuizQuestionDto>({
    resolver,
    defaultValues: {
      questionText: "",
      orderIndex: questionLength,
      answers: [],
      questionType: "mcq",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "answers",
  });

  const { isSubmitting, isValid } = form.formState;
  const questionType = form.watch("questionType");

  const onSubmit = async (data: CreateQuizQuestionDto) => {
    try {
      const [response, error] = await attempt(createQuestion(quizId, data));
      if (error) {
        toast.error(t("quizzes.failedToCreateQuestion"));
        return;
      }
      setQuestions((questions: QuizQuestion[]) => [
        ...questions,
        response.data!,
      ]);
      toast.success(t("quizzes.questionCreatedSuccessfully"));
      form.reset();
    } catch (error) {
      toast.error(t("quizzes.failedToCreateQuestion"));
    }
  };

  return (
    <Dialog>
      <div className="flex w-full justify-end">
        <DialogTrigger asChild>
          {trigger || (
            <Button className="mt-2 gap-2 md:mt-0">
              <IconPlus className="h-4 w-4" />
              {t("quizzes.addQuestion")}
            </Button>
          )}
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-2xl">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{t("quizzes.createQuestion")}</DialogTitle>
              <DialogDescription>
                {t("quizzes.createQuestionDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quizzes.questionType")}</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("quizzes.selectQuestionType")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mcq">
                          {t("quizzes.multipleChoice")}
                        </SelectItem>
                        <SelectItem value="true_false">
                          {t("quizzes.trueFalse")}
                        </SelectItem>
                        <SelectItem value="essay">
                          {t("quizzes.essay")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quizzes.question")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("common.titlePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {questionType !== "essay" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t("quizzes.answers")}</Label>
                    <Button
                      className="gap-2"
                      onClick={() =>
                        append({ answerText: "", isCorrect: false })
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <IconPlus className="h-4 w-4" />
                      {t("quizzes.addAnswer")}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        className="bg-primary/5 flex items-start gap-4 rounded-lg border p-4"
                        key={field.id}
                      >
                        <div className="flex-1 space-y-2">
                          <FormField
                            control={form.control}
                            name={`answers.${index}.answerText`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t("quizzes.answer")} {index + 1}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t("quizzes.answerPlaceholder")}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-8">
                          <FormField
                            control={form.control}
                            name={`answers.${index}.isCorrect`}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>{t("quizzes.correct")}</FormLabel>
                              </FormItem>
                            )}
                          />
                          {fields.length > 1 && (
                            <Button
                              onClick={() => remove(index)}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {questionType === "essay" && (
                <div className="bg-muted rounded-lg p-4 text-sm">
                  <p className="text-muted-foreground">
                    {t("quizzes.essayQuestionNote")}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button disabled={isSubmitting || !isValid} type="submit">
                {isSubmitting
                  ? t("common.submitting")
                  : t("quizzes.createQuestion")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
