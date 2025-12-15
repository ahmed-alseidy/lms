"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { getQuizResults, isQuizCompleted } from "@/lib/quizzes";
import { attempt, cn } from "@/lib/utils";

export default function ResultsPage() {
  const { courseId, quizId } = useParams();
  const t = useTranslations();

  const { data: quizResultsData, isLoading: isQuizResultsLoading } = useQuery({
    queryKey: ["quizResults", quizId],
    queryFn: async () => {
      const [response, error] = await attempt(getQuizResults(quizId as string));

      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return null;
      }
      return response.data;
    },
  });

  const { data: quizCompletion, isLoading: isQuizCompletionLoading } = useQuery(
    {
      queryKey: ["quizCompletion", quizId],
      queryFn: async () => {
        const [response, error] = await attempt(
          isQuizCompleted(quizId as string)
        );

        if (error) {
          toast.error(t("common.somethingWentWrong"));
          return null;
        }

        return response.data;
      },
    }
  );

  if (isQuizResultsLoading || isQuizCompletionLoading) {
    return (
      <div className="flex h-full min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader className="text-muted-foreground h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!quizCompletion?.completed) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold">
          {t("quizzes.quizNotCompleted")}
        </h2>
        <Link
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "mt-4"
          )}
          href={`/courses/${courseId}/quiz/${quizId}`}
        >
          {t("quizzes.startQuiz")}
        </Link>
      </div>
    );
  }

  const results = quizResultsData!;
  const percentage = Number(results.score) * 100;
  const questionsCount = results.questions.length;

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-lg p-6 shadow">
      <h1 className="mb-2 text-center text-2xl font-bold">
        {t("quizzes.quizResults")}
      </h1>
      <h2 className="text-muted-foreground mb-3 text-center text-lg">
        {results.quiz.title}
      </h2>
      <div className="mb-8 flex flex-col items-center">
        <div
          className={cn(
            "text-4xl font-bold",
            percentage >= 70 ? "text-green-600" : "text-red-600"
          )}
        >
          {percentage}%
        </div>
        <div className="text-muted-foreground mt-2 text-sm">
          {percentage >= 70
            ? t("quizzes.greatJob")
            : t("quizzes.keepPracticing")}
        </div>
      </div>
      <div className="mb-6">
        <h3 className="mb-2 font-semibold">{t("quizzes.summary")}</h3>
        <div className="flex gap-4">
          <span className="text-green-600">
            {t("quizzes.correct")}:{" "}
            {Math.round(Number(results.score) * questionsCount)}
          </span>
          <span className="text-red-600">
            {t("quizzes.incorrect")}:{" "}
            {questionsCount -
              Math.round(Number(results.score) * questionsCount)}
          </span>
        </div>
      </div>
      <div className="mb-8">
        <h3 className="mb-2 font-semibold">{t("quizzes.detailedAnswers")}</h3>
        <ul className="space-y-4">
          {results.questions.map((q, idx) => (
            <li
              className={`rounded border-2 p-4 ${q.submittedAnswer.id === q.correctAnswer.id ? "bg-accent/50 border-green-300" : "bg-accent/50 border-red-300"}`}
              key={idx}
            >
              <div className="font-medium">
                {t("quizzes.question")} {idx + 1}: {q.questionText}
              </div>
              <div className="ml-2">
                <span className="font-semibold">
                  {t("quizzes.yourAnswer")}:
                </span>{" "}
                <span
                  className={
                    q.submittedAnswer.id === q.correctAnswer.id
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {q.submittedAnswer.answerText}
                </span>
              </div>
              {q.submittedAnswer.id !== q.correctAnswer.id && (
                <div className="text-muted-foreground ml-2 text-sm">
                  <span className="font-semibold">
                    {t("quizzes.correctAnswer")}:
                  </span>{" "}
                  {q.correctAnswer.answerText}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-center gap-4">
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          href={`/courses/${courseId}`}
        >
          {t("quizzes.backToCourse")}
        </Link>
      </div>
    </div>
  );
}
