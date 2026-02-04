"use client";

import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export const QuestionPagination = ({
  questions,
  currentQuestionIndex,
  selectedAnswers,
  onQuestionSelect,
  isTimerExpired,
}: {
  questions: any[];
  currentQuestionIndex: number;
  selectedAnswers: Record<string, string>;
  onQuestionSelect: (index: number) => void;
  isTimerExpired: boolean;
}) => {
  const t = useTranslations();
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length;

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">
          {t("quizzes.navigateToQuestion")}
        </span>
        <span className="text-muted-foreground text-xs">
          {t("quizzes.of")} {answeredCount} {t("quizzes.of")} {totalQuestions}{" "}
          {t("quizzes.answered")}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => {
          const isAnswered = selectedAnswers[question.id];
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              className={`relative flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground"
                  : isAnswered
                    ? "border-green-500 bg-green-50 text-green-700 hover:border-green-600 hover:bg-green-100"
                    : "border-muted-foreground/30 bg-background text-muted-foreground hover:border-primary hover:bg-muted"
              } ${isTimerExpired ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              disabled={isTimerExpired}
              key={question.id}
              onClick={() => onQuestionSelect(index)}
              title={`Question ${index + 1}${isAnswered ? " (Answered)" : " (Not answered)"}`}
            >
              {index + 1}
              {isAnswered && (
                <CheckCircle className="absolute -top-1 -right-1 h-4 w-4" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
