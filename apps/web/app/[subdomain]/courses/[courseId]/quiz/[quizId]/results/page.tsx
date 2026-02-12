"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

  // Calculate statistics
  const getStats = () => {
    const autoGradableQuestions = results.questions.filter(
      (q) => q.questionType !== "essay"
    );
    const essayQuestions = results.questions.filter(
      (q) => q.questionType === "essay"
    );

    const autoGradableCorrect = autoGradableQuestions.filter((q) => {
      if (
        !q.submittedAnswer ||
        (q.questionType !== "mcq" && q.questionType !== "true_false")
      )
        return false;
      return q.submittedAnswer.id === q.correctAnswer?.id;
    }).length;

    // Use graded score if available; when graded, show it; when pending with essays, don't show auto_score as main score
    const isGraded = results.status === "graded";
    const finalScore = isGraded ? results.score : results.autoScore;
    const percentage = Number(finalScore) * 100;
    const hasEssays = essayQuestions.length > 0;
    const isPendingGrading =
      results.status === "pending" || results.status === "auto_graded";
    // When essay questions exist and not yet graded, don't show auto_score as the main score
    const showMainScore = isGraded || !hasEssays;
    const objectivePercentage = Number(results.autoScore) * 100;

    return {
      totalQuestions: results.questions.length,
      autoGradableCount: autoGradableQuestions.length,
      essayCount: essayQuestions.length,
      autoGradableCorrect,
      autoGradableIncorrect: autoGradableQuestions.length - autoGradableCorrect,
      percentage: percentage || 0,
      hasEssays,
      isPendingGrading,
      showMainScore,
      objectivePercentage: objectivePercentage || 0,
    };
  };
  const stats = getStats();

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-border p-6">
      <h1 className="mb-2 text-center text-2xl font-bold">
        {t("quizzes.quizResults")}
      </h1>
      <h2 className="text-muted-foreground mb-3 text-center text-lg">
        {results.quiz.title}
      </h2>

      {/* Status Badge */}
      <div className="mb-4 flex justify-center">
        {results.status === "graded" ? (
          <Badge className="bg-green-600" variant="default">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {t("quizzes.statusGraded")}
          </Badge>
        ) : results.status === "auto_graded" ? (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            {t("quizzes.statusAutoGraded")}
          </Badge>
        ) : (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            {t("quizzes.statusPending")}
          </Badge>
        )}
      </div>

      {/* Score Display */}
      <div className="mb-8 flex flex-col items-center">
        <div
          className={cn(
            "text-4xl font-bold",
            stats.showMainScore &&
              (stats.percentage >= 70 ? "text-green-600" : "text-red-600")
          )}
        >
          {stats.showMainScore
            ? `${stats.percentage.toFixed(0)}%`
            : t("quizzes.scorePending")}
        </div>
        <div className="text-muted-foreground mt-2 text-sm">
          {stats.isPendingGrading && stats.hasEssays
            ? t("quizzes.scoreSubjectToChange")
            : stats.showMainScore
              ? stats.percentage >= 70
                ? t("quizzes.greatJob")
                : t("quizzes.keepPracticing")
              : null}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h3 className="mb-2 font-semibold">{t("quizzes.summary")}</h3>
        <div className="space-y-2">
          {stats.autoGradableCount > 0 && (
            <div className="flex gap-4">
              <span className="text-green-600">
                {t("quizzes.correct")}: {stats.autoGradableCorrect}
              </span>
              <span className="text-red-600">
                {t("quizzes.incorrect")}: {stats.autoGradableIncorrect}
              </span>
            </div>
          )}
          {stats.hasEssays &&
            stats.isPendingGrading &&
            stats.autoGradableCount > 0 && (
              <div className="text-muted-foreground text-sm">
                {t("quizzes.objectiveScore", {
                  percentage: stats.objectivePercentage.toFixed(0),
                })}
              </div>
            )}
          {stats.hasEssays && (
            <div className="text-muted-foreground text-sm">
              {t("quizzes.essayQuestionsCount", { count: stats.essayCount })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Answers */}
      <div className="mb-8">
        <h3 className="mb-2 font-semibold">{t("quizzes.detailedAnswers")}</h3>
        <ul className="space-y-4">
          {results.questions.map((q, idx) => {
            const isEssay = q.questionType === "essay";
            const isCorrectChoice =
              !isEssay &&
              q.submittedAnswer &&
              (q.questionType === "mcq" || q.questionType === "true_false") &&
              q.submittedAnswer.id === q.correctAnswer?.id;
            const essayGraded = isEssay && q.isCorrect !== undefined;
            const borderStyle = isEssay
              ? essayGraded
                ? q.isCorrect
                  ? "border-green-300 bg-input/30"
                  : "border-red-300 bg-input/30"
                : "border-blue-300 bg-input/30"
              : isCorrectChoice
                ? "border-green-300 bg-input/30"
                : "border-red-300 bg-input/30";

            return (
              <li className={cn("rounded border-2 p-4", borderStyle)} key={idx}>
                <div className="mb-2 flex items-start justify-between">
                  <div className="font-medium">
                    {t("quizzes.question")} {idx + 1}: {q.questionText}
                  </div>
                  {isEssay && (
                    <Badge className="ml-2" variant="outline">
                      {t("quizzes.essay")}
                    </Badge>
                  )}
                </div>

                {/* Essay Answer */}
                {isEssay && (
                  <div className="ml-2 space-y-2">
                    <div>
                      <span className="font-semibold">
                        {t("quizzes.yourAnswer")}:
                      </span>
                    </div>
                    <div className="text-muted-foreground rounded bg-muted p-3 text-sm">
                      {q.textAnswer ?? t("quizzes.noAnswerSubmitted")}
                    </div>
                    {essayGraded ? (
                      <div
                        className={cn(
                          "text-xs font-medium",
                          q.isCorrect
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        )}
                      >
                        {q.isCorrect ? (
                          <>
                            <CheckCircle2 className="mr-1 inline h-4 w-4" />
                            {t("quizzes.correct")}
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 inline h-4 w-4" />
                            {t("quizzes.incorrect")}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-xs italic">
                        {t("quizzes.essayWillBeGradedByInstructor")}
                      </div>
                    )}
                  </div>
                )}

                {/* Multiple Choice / True-False Answer */}
                {!isEssay && (
                  <>
                    <div className="ml-2">
                      <span className="font-semibold">
                        {t("quizzes.yourAnswer")}:
                      </span>{" "}
                      {q.submittedAnswer &&
                      (q.questionType === "mcq" ||
                        q.questionType === "true_false") ? (
                        <span
                          className={
                            isCorrectChoice ? "text-green-700" : "text-red-700"
                          }
                        >
                          {isCorrectChoice ? (
                            <CheckCircle2 className="mr-1 inline h-4 w-4" />
                          ) : (
                            <XCircle className="mr-1 inline h-4 w-4" />
                          )}
                          {q.submittedAnswer?.answerText}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("quizzes.noAnswerSubmitted")}
                        </span>
                      )}
                    </div>
                    {!isCorrectChoice && q.correctAnswer && (
                      <div className="text-muted-foreground ml-2 text-sm">
                        <span className="font-semibold">
                          {t("quizzes.correctAnswer")}:
                        </span>{" "}
                        {q.correctAnswer.answerText}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Action Buttons */}
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
