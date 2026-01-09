"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, Loader, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getCourse } from "@/lib/courses";
import {
  findQuiz,
  isQuizCompleted,
  resumeQuiz,
  saveAnswer,
  startQuiz,
  submitQuiz,
} from "@/lib/quizzes";
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
  timeRemaining: number | null;
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

  if (timeRemaining === null) {
    return null;
  }

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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSubmittedRef = useRef(false);

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

  const enrollmentId = courseData?.enrollments?.[0]?.id;

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
    queryKey: ["quiz-completed", quizId],
    queryFn: async () => {
      const [response, error] = await attempt(isQuizCompleted(quizId));
      if (error) {
        throw new Error("Failed to check quiz completion");
      }
      return response.data;
    },
    retry: 2,
    enabled: !!quizId,
  });

  const quizCompleted = quizCompletedResponse?.completed || false;

  // Track when timer should be active (memoized to prevent unnecessary re-renders)
  const shouldTimerRun = useMemo(() => {
    return timeRemaining !== null && !isStarting && !isTimerExpired;
  }, [timeRemaining, isStarting, isTimerExpired, quizCompleted]);

  // Start or resume quiz on mount
  useEffect(() => {
    if (!quiz || !enrollmentId || quizCompleted || !isStarting) return;

    const initializeQuiz = async () => {
      try {
        // Try to resume existing quiz first
        const [resumeResponse, resumeError] = await attempt(
          resumeQuiz(quizId, enrollmentId)
        );

        console.log("resumeResponse", resumeResponse?.data);

        if (!resumeError && resumeResponse?.data) {
          // Resume existing quiz
          const resumeData = resumeResponse.data;
          setSubmissionId(resumeData.submissionId);
          setTimeRemaining(resumeData.timeRemaining);
          // Convert saved answers from Record<number, number> to Record<number, number>
          setSelectedAnswers(resumeData.savedAnswers || {});
          setIsStarting(false);
          return;
        }

        // No in-progress quiz, start new one
        const [startResponse, startError] = await attempt(
          startQuiz(quizId, enrollmentId)
        );

        console.log("start response", startResponse?.data);

        if (startError || !startResponse?.data) {
          toast.error(t("quizzes.failedToStartQuiz"));
          setIsStarting(false);
          return;
        }

        const startData = startResponse.data;
        setSubmissionId(startData.submissionId);
        setTimeRemaining(startData.timeRemaining);
        setIsStarting(false);
      } catch (error) {
        toast.error(t("common.somethingWentWrong"));
        setIsStarting(false);
      }
    };

    initializeQuiz();
  }, [quiz, enrollmentId, quizId, quizCompleted, isStarting, t]);

  // Update timer from server periodically
  useEffect(() => {
    if (!submissionId || isTimerExpired || quizCompleted || isStarting) return;

    const updateTimer = async () => {
      try {
        const [resumeResponse] = await attempt(
          resumeQuiz(quizId, enrollmentId!)
        );
        if (resumeResponse?.data) {
          const newTimeRemaining = resumeResponse.data.timeRemaining;
          setTimeRemaining(newTimeRemaining);
          if (newTimeRemaining <= 0) {
            setIsTimerExpired(true);
          }
        }
      } catch (error) {
        // Silent fail, timer will update on next interval
      }
    };

    // Update every 30 seconds
    const interval = setInterval(updateTimer, 30000);

    return () => clearInterval(interval);
  }, [
    submissionId,
    quizId,
    enrollmentId,
    isTimerExpired,
    quizCompleted,
    isStarting,
  ]);

  // Keep ref in sync with state for interval callback
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  // Check if timer should expire immediately when timeRemaining is set
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining <= 0 && !isTimerExpired) {
      setIsTimerExpired(true);
    }
  }, [timeRemaining, isTimerExpired]);

  // Client-side timer countdown
  useEffect(() => {
    console.log("Timer effect - shouldTimerRun:", shouldTimerRun);
    console.log("Timer effect - timeRemaining:", timeRemaining);
    console.log("Timer effect - isStarting:", isStarting);

    // Clear any existing timer first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Don't start countdown if conditions aren't met
    if (!shouldTimerRun) {
      console.log("Timer not ready - shouldTimerRun is false");
      return;
    }

    console.log("Starting timer countdown with timeRemaining:", timeRemaining);

    // Timer is ready to start - timeRemaining is set and initialization is complete
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        // Use ref to get the most current value in case state hasn't updated yet
        const current = prev ?? timeRemainingRef.current;
        if (current === null || current <= 1) {
          setIsTimerExpired(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      console.log("Clearing timer on cleanup");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [shouldTimerRun]);

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

  // Auto-save answer with debouncing
  const handleAnswerSelect = useCallback(
    async (questionId: number, answerId: number) => {
      if (!submissionId || isTimerExpired) return;

      // Update local state immediately
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: answerId,
      }));

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce auto-save (500ms)
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const [, error] = await attempt(
            saveAnswer(quizId, submissionId, questionId, answerId)
          );

          if (error) {
            toast.error(t("quizzes.failedToSaveAnswer"));
          }
        } catch (error) {
          // Silent fail for auto-save
        }
      }, 500);
    },
    [submissionId, quizId, isTimerExpired, t]
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

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !enrollmentId || !submissionId) return;
    setIsSubmitting(true);

    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    try {
      // Convert selectedAnswers to SubmittedAnswer format
      const answers = Object.entries(selectedAnswers).map(
        ([questionId, answerId]) => ({
          questionId: Number(questionId),
          answerId: Number(answerId),
        })
      );

      const [, error] = await attempt(
        submitQuiz(quizId, enrollmentId, answers)
      );

      if (error) {
        toast.error(t("quizzes.failedToSubmitQuiz"));
        return;
      }

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
    submissionId,
    queryClient,
    courseId,
    router,
    t,
  ]);

  // Auto-submit when timer expires
  useEffect(() => {
    // Only auto-submit if timer was actually initialized (timeRemaining !== null)
    // and has expired
    if (
      isTimerExpired &&
      !isSubmitting &&
      !quizCompleted &&
      submissionId &&
      timeRemaining !== null &&
      !hasAutoSubmittedRef.current
    ) {
      hasAutoSubmittedRef.current = true;
      toast.warning(t("quizzes.timeIsUpSubmittingQuizAutomatically"));
      handleSubmit();
    }
  }, [
    isTimerExpired,
    isSubmitting,
    quizCompleted,
    submissionId,
    timeRemaining,
    handleSubmit,
    t,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

  if (
    isQuizLoading ||
    isQuizCompletedLoading ||
    isCourseLoading ||
    isStarting ||
    !submissionId
  ) {
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

  if (quizCompleted && isTimerExpired) {
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
              handleAnswerSelect(currentQuestion.id, Number(value))
            }
            value={selectedAnswers[currentQuestion.id]?.toString()}
          >
            {currentQuestion.answers.map((option) => (
              <label
                className={`flex cursor-pointer items-center rounded-lg border px-4 py-3 transition-colors ${
                  selectedAnswers[currentQuestion.id] === option.id
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
            selectedAnswers={Object.fromEntries(
              Object.entries(selectedAnswers).map(([k, v]) => [k, v.toString()])
            )}
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
                  Object.keys(selectedAnswers).length === 0
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
