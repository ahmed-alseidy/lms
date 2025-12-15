"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { CheckCircle, Clock, Loader, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getCourse } from "@/lib/courses";
import { findQuiz, isQuizCompleted, submitQuiz } from "@/lib/quizzes";
import { attempt } from "@/lib/utils";

const LoadingSpinner = () => (
  <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
    <Loader className="text-muted-foreground h-10 w-10 animate-spin" />
  </div>
);

const ErrorState = ({
  title,
  buttonText,
  onButtonClick,
}: {
  title: string;
  buttonText: string;
  onButtonClick: () => void;
}) => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      <Button onClick={onButtonClick}>{buttonText}</Button>
    </div>
  </div>
);

const TimerDisplay = ({
  timeRemaining,
  isTimerExpired,
}: {
  timeRemaining: number;
  isTimerExpired: boolean;
}) => {
  const t = useTranslations();
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const getTimeColor = useCallback((seconds: number) => {
    if (seconds <= 300) return "text-red-500"; // Last 5 minutes
    if (seconds <= 600) return "text-yellow-500"; // Last 10 minutes
    return "text-green-500";
  }, []);

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <span className="text-sm font-medium">
          {t("quizzes.timeRemaining")} :
        </span>
        <span className={`text-lg font-bold ${getTimeColor(timeRemaining)}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      {isTimerExpired && (
        <div className="text-sm font-medium text-red-500">
          {t("quizzes.timeIsUpSubmittingQuizAutomatically")}
        </div>
      )}
    </div>
  );
};

const QuestionPagination = ({
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

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();
  const courseId = Number(params.courseId);
  const quizId = params.quizId as string;
  const [quizEndTimeDetails, setQuizEndTimeDetails] = useLocalStorage<{
    quizId: string;
    endTime: number;
    localSelectedAnswers: Record<string, string>;
  } | null>("quizEndTimeDetails", null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ["student-course", courseId],
    queryFn: async () => {
      const [response, error] = await attempt(getCourse(courseId, false, true));
      if (error) {
        toast.error("Failed to fetch course");
        return null;
      }
      return response.data;
    },
  });

  const {
    data: quizResponse,
    isLoading: isQuizLoading,
    error: quizError,
  } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const [response, error] = await attempt(findQuiz(quizId));
      if (error) {
        throw new Error("Failed to fetch quiz");
      }
      return response;
    },
    retry: 2,
  });

  const quiz = quizResponse?.data;

  const {
    data: quizCompletedResponse,
    isLoading: isQuizCompletedLoading,
    error: completionError,
  } = useQuery({
    queryKey: ["quiz-completed", quizId, courseId],
    queryFn: async () => {
      const [courseResponse, courseError] = await attempt(
        getCourse(courseId, false, true)
      );
      if (courseError) {
        throw new Error("Failed to fetch course");
      }

      const enrollmentId = courseResponse?.data?.enrollments?.[0]?.id;
      if (!enrollmentId) {
        throw new Error("Not enrolled in course");
      }

      const [response, error] = await attempt(isQuizCompleted(quizId));
      if (error) {
        throw new Error("Failed to check quiz completion");
      }

      return { completed: response.data.completed, enrollmentId };
    },
    retry: 2,
    enabled: !!courseId && !!quizId,
  });

  const quizCompleted = quizCompletedResponse?.completed || false;
  const enrollmentId = quizCompletedResponse?.enrollmentId;

  const { progress, progressText, totalQuestions, currentQuestion } =
    useMemo(() => {
      if (!quiz?.questions?.length) {
        return {
          progress: 0,
          progressText: "0% Complete",
          answeredCount: 0,
          totalQuestions: 0,
          currentQuestion: null,
        };
      }

      const totalQuestions = quiz.questions.length;
      const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
      const progressText = `${Math.round(progress)}% Complete`;
      const answeredCount = Object.keys(selectedAnswers).length;
      const currentQuestion = quiz.questions[currentQuestionIndex];

      return {
        progress,
        progressText,
        answeredCount,
        totalQuestions,
        currentQuestion,
      };
    }, [quiz?.questions, currentQuestionIndex, selectedAnswers]);

  useEffect(() => {
    if (quiz?.duration && !quizCompleted) {
      const duration = quiz.duration * 60;

      if (!quizEndTimeDetails) {
        // First time taking any quiz
        const now = new Date();
        const endTime = new Date(now.getTime() + duration * 1000);
        setQuizEndTimeDetails({
          quizId,
          endTime: endTime.getTime(),
          localSelectedAnswers: {},
        });
        setTimeRemaining(duration);
      } else if (quizEndTimeDetails.quizId !== quizId) {
        // Switching to a different quiz
        const handleQuizSwitch = async () => {
          try {
            // Check if the old quiz is completed
            const [completionResponse, completionError] = await attempt(
              isQuizCompleted(quizEndTimeDetails.quizId)
            );

            if (completionError) {
              toast.error("Failed to check previous quiz status");
              return;
            }

            if (!completionResponse.data.completed) {
              // Auto-submit the old quiz if not completed
              const [submitResponse, submitError] = await attempt(
                submitQuiz(
                  quizEndTimeDetails.quizId,
                  courseData?.enrollments?.[0]?.id!,
                  Object.entries(quizEndTimeDetails.localSelectedAnswers).map(
                    ([key, value]) => ({
                      questionId: Number(key),
                      answerId: Number(value),
                    })
                  )
                )
              );

              if (submitError) {
                toast.error(t("quizzes.failedToSubmitPreviousQuiz"));
                return;
              }

              toast.info(t("quizzes.previousQuizWasAutomaticallySubmitted"));
            }

            // Set up new quiz timer
            const now = new Date();
            const endTime = new Date(now.getTime() + duration * 1000);
            setQuizEndTimeDetails({
              quizId,
              endTime: endTime.getTime(),
              localSelectedAnswers: {},
            });
            setTimeRemaining(duration);

            // Clear previous quiz answers
            setSelectedAnswers({});
            setCurrentQuestionIndex(0);
          } catch (error) {
            toast.error(t("quizzes.failedToSwitchQuizzes"));
          }
        };

        handleQuizSwitch();
      } else {
        // Same quiz - resume timer
        const now = new Date();
        const timeRemaining = Math.max(
          0,
          quizEndTimeDetails.endTime - now.getTime()
        );
        setSelectedAnswers(quizEndTimeDetails.localSelectedAnswers || {});

        if (timeRemaining <= 0) {
          // Timer has expired, auto-submit
          setIsTimerExpired(true);
          setTimeRemaining(0);
        } else {
          setTimeRemaining(Math.round(timeRemaining / 1000));
        }
      }
    }
  }, [quiz?.duration, quizCompleted, quizId, enrollmentId, courseData]);

  useEffect(() => {
    if (timeRemaining <= 0 || isTimerExpired || quizCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isTimerExpired, quizCompleted]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || quizCompleted || !enrollmentId) return;
    setIsSubmitting(true);

    try {
      const [, error] = await attempt(
        submitQuiz(
          quizId,
          enrollmentId,
          Object.entries(selectedAnswers).map(([key, value]) => ({
            questionId: Number(key),
            answerId: Number(value),
          }))
        )
      );

      if (error) {
        toast.error(t("quizzes.failedToSubmitQuiz"));
        return;
      }

      // Reset local storage timer
      setQuizEndTimeDetails(null);

      toast.success(t("quizzes.quizSubmittedSuccessfully"));

      // Invalidate quiz completion status
      queryClient.invalidateQueries({
        queryKey: ["quiz-completed", quizId],
      });

      router.push(`/courses/${courseId}/quiz/${quizId}/results`);
    } catch (error) {
      toast.error(t("common.somethingWentWrong"));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    quizId,
    enrollmentId,
    selectedAnswers,
    isSubmitting,
    quizCompleted,
    queryClient,
    courseId,
    router,
  ]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (isTimerExpired && !isSubmitting && !quizCompleted) {
      toast.warning(t("quizzes.timeIsUpSubmittingQuizAutomatically"));
      handleSubmit();
    }
  }, [isTimerExpired, isSubmitting, quizCompleted, handleSubmit]);

  const handleAnswerSelect = useCallback(
    (questionId: number, optionId: string) => {
      setSelectedAnswers((prev) => {
        const newSelectedAnswers = {
          ...prev,
          [questionId]: optionId,
        };
        setQuizEndTimeDetails((prev) => {
          return {
            ...prev!,
            localSelectedAnswers: newSelectedAnswers,
          };
        });
        return newSelectedAnswers;
      });
    },
    [quizId]
  );

  const handleQuestionSelect = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
  }, [totalQuestions]);

  if (quizError) {
    return (
      <ErrorState
        buttonText={t("quizzes.backToCourse")}
        onButtonClick={() => router.push(`/courses/${courseId}`)}
        title={t("quizzes.failedToLoadQuiz")}
      />
    );
  }

  if (completionError?.message === "Not enrolled in course") {
    return (
      <ErrorState
        buttonText={t("quizzes.enrollNow")}
        onButtonClick={() => router.push(`/courses/${courseId}/enroll`)}
        title={t("quizzes.notEnrolledInCourse")}
      />
    );
  }

  if (completionError) {
    return (
      <ErrorState
        buttonText={t("quizzes.backToCourse")}
        onButtonClick={() => router.push(`/courses/${courseId}`)}
        title={t("quizzes.failedToLoadCourseData")}
      />
    );
  }

  if (isQuizLoading || isQuizCompletedLoading || isCourseLoading) {
    return <LoadingSpinner />;
  }

  if (!enrollmentId) {
    return (
      <ErrorState
        buttonText={t("quizzes.enrollNow")}
        onButtonClick={() => router.push(`/courses/${courseId}/enroll`)}
        title={t("quizzes.notEnrolledInCourse")}
      />
    );
  }

  if (!quiz) {
    return (
      <ErrorState
        buttonText={t("quizzes.backToCourse")}
        onButtonClick={() => router.push(`/courses/${courseId}`)}
        title={t("quizzes.quizNotFound")}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <ErrorState
        buttonText={t("quizzes.backToCourse")}
        onButtonClick={() => router.push(`/courses/${courseId}`)}
        title={t("quizzes.noQuestionsAvailable")}
      />
    );
  }

  if (quizCompleted) {
    // If the quiz was completed and there is another quiz in progress, clear the local storage of the current quiz
    if (quizEndTimeDetails?.quizId === quizId) {
      setQuizEndTimeDetails(null);
    }
    return (
      <ErrorState
        buttonText={t("quizzes.viewResults")}
        onButtonClick={() =>
          router.push(`/courses/${courseId}/quiz/${quizId}/results`)
        }
        title={t("quizzes.quizAlreadyCompleted")}
      />
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-2">
      <Card className="border-border mx-auto w-full max-w-2xl rounded-xl border shadow-sm">
        <CardContent className="pt-6">
          <TimerDisplay
            isTimerExpired={isTimerExpired}
            timeRemaining={timeRemaining}
          />

          {/* Progress and question count */}
          <div className="mb-2 flex items-center justify-between">
            <div className="text-2xl font-bold">
              {t("quizzes.question")} {currentQuestionIndex + 1}{" "}
              {t("quizzes.of")} {totalQuestions}
            </div>
            <div className="text-sm font-medium">{progressText}</div>
          </div>
          <Progress
            className="bg-muted mb-6 h-2 rounded-full"
            value={progress}
          />

          {/* Question text */}
          <div className="mb-6 text-xl font-semibold">
            {currentQuestion.questionText}
          </div>

          {/* Answer options */}
          <RadioGroup
            className="mb-8 space-y-4"
            disabled={isTimerExpired}
            onValueChange={(value: string) =>
              handleAnswerSelect(currentQuestion.id, value)
            }
            value={selectedAnswers[currentQuestion.id]}
          >
            {currentQuestion.answers.map((option) => (
              <label
                className={`flex cursor-pointer items-center rounded-lg border px-4 py-3 transition-colors ${
                  selectedAnswers[currentQuestion.id] === option.id.toString()
                    ? "border-primary bg-muted"
                    : "border-muted-foreground/60 bg-sidebar hover:border-primary"
                } ${isTimerExpired ? "cursor-not-allowed opacity-50" : ""}`}
                htmlFor={option.id.toString()}
                key={option.id}
              >
                <RadioGroupItem
                  className="mr-3"
                  disabled={isTimerExpired}
                  id={option.id.toString()}
                  value={option.id.toString()}
                />
                <span className="text-base">{option.answerText}</span>
              </label>
            ))}
          </RadioGroup>

          {/* Question Pagination */}
          <QuestionPagination
            currentQuestionIndex={currentQuestionIndex}
            isTimerExpired={isTimerExpired}
            onQuestionSelect={handleQuestionSelect}
            questions={quiz.questions}
            selectedAnswers={selectedAnswers}
          />

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            <Button
              className="min-w-[100px]"
              disabled={currentQuestionIndex === 0 || isTimerExpired}
              onClick={handlePrevious}
              variant="outline"
            >
              {t("common.previous")}
            </Button>
            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                className="min-w-[100px]"
                disabled={
                  isSubmitting ||
                  isTimerExpired ||
                  !selectedAnswers[currentQuestion.id]
                }
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.submitting")}
                  </>
                ) : (
                  t("quizzes.submitQuiz")
                )}
              </Button>
            ) : (
              <Button
                className="min-w-[100px]"
                disabled={
                  !selectedAnswers[currentQuestion.id] || isTimerExpired
                }
                onClick={handleNext}
              >
                {t("common.next")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
