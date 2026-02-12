"use client";

import { IconGripVertical, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { QuizAnswer, QuizQuestion } from "@/lib/quizzes";
import { AnswerEditForm } from "./answer-edit-form";
import { QuestionTitleForm } from "./question-title-form";

interface QuestionCardProps {
  question: QuizQuestion;
  questionIndex: number;
  isLoading: boolean;
  onDelete: (questionId: number) => void;
  onAddAnswer: (questionId: number) => void;
  onUpdateAnswer: (
    questionId: number,
    answerId: number,
    data: Partial<QuizAnswer>
  ) => void;
  onDeleteAnswer: (questionId: number, answerId: number) => void;
  dragHandleProps?: any;
}

export function QuestionCard({
  question,
  questionIndex,
  isLoading,
  onDelete,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
  dragHandleProps,
}: QuestionCardProps) {
  const t = useTranslations();

  return (
    <Card
      className={`hover:border-primary/50 shadow-none hover:shadow-sm ${
        isLoading ? "opacity-50" : ""
      }`}
    >
      <CardHeader className="border-b bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing"
              >
                <IconGripVertical className="text-muted-foreground h-5 w-5" />
              </div>
            )}
            <CardTitle className="text-lg">
              {t("quizzes.question")} {questionIndex + 1}:{" "}
              {question.questionText}
            </CardTitle>
          </div>
          <Button
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(question.id)}
            size="icon"
            variant="ghost"
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pt-4">
          <div>
            <h3 className="mb-3 text-sm font-medium">
              {t("quizzes.questionDetails")}
            </h3>
            <QuestionTitleForm
              initialData={{
                questionText: question.questionText,
              }}
              questionId={question.id}
            />
          </div>

          {question.questionType === "essay" ? (
            <>
              <Separator />
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {t("quizzes.questionType")}:
                  </span>
                  <span className="text-muted-foreground">
                    {t("quizzes.essay")}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {t("quizzes.essayQuestionInfo")}
                </p>
              </div>
            </>
          ) : (
            <>
              <Separator />
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {t("quizzes.answers")}
                  </h3>
                  <Button
                    className="gap-2"
                    onClick={() => onAddAnswer(question.id)}
                    size="sm"
                    variant="outline"
                  >
                    <IconPlus className="h-4 w-4" />
                    {t("quizzes.addAnswer")}
                  </Button>
                </div>

                <div className="space-y-4">
                  {question.answers?.map((answer) => (
                    <div
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-4"
                      key={answer.id}
                    >
                      <AnswerEditForm
                        answerId={answer.id}
                        initialData={{
                          answerText: answer.answerText,
                        }}
                      />
                      <div className="flex items-center gap-2 pt-8">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={answer.isCorrect}
                            id={`correct-${answer.id}`}
                            onCheckedChange={(checked) =>
                              onUpdateAnswer(question.id, answer.id, {
                                isCorrect: checked === true,
                              })
                            }
                          />
                          <Label htmlFor={`correct-${answer.id}`}>
                            {t("quizzes.correct")}
                          </Label>
                        </div>
                        <Button
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDeleteAnswer(question.id, answer.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
