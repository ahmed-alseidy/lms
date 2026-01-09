"use client";

import { IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { QuestionDialog } from "./question-dialog";

interface EmptyQuestionsStateProps {
  questionLength: number;
  quizId: string;
  setQuestions: React.Dispatch<React.SetStateAction<any[]>>;
}

export function EmptyQuestionsState({
  questionLength,
  quizId,
  setQuestions,
}: EmptyQuestionsStateProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
        <IconPlus className="text-primary h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-medium">
        {t("quizzes.noQuestionsYet")}
      </h3>
      <p className="text-muted-foreground mt-2 text-sm">
        {t("quizzes.addQuestionsToYourQuiz")}
      </p>
      <div className="mt-6">
        <QuestionDialog
          questionLength={questionLength}
          quizId={quizId}
          setQuestions={setQuestions}
          trigger={
            <Button className="gap-2">
              <IconPlus className="h-4 w-4" />
              {t("quizzes.addQuestion")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
