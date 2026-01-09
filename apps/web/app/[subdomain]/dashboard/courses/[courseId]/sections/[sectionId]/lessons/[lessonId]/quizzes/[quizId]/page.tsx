"use client";

import { UpdateQuizQuestionDto } from "@lms-saas/shared-lib/dtos";
import { IconLoader } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { findCourseSection, findLesson, getCourse } from "@/lib/courses";
import {
  addAnswer,
  deleteAnswer,
  deleteQuestion,
  findQuiz,
  QuizAnswer,
  QuizQuestion,
  updateAnswer,
  updateQuestion,
} from "@/lib/quizzes";
import { attempt } from "@/lib/utils";
import { DeleteDialogs } from "./_components/delete-dialogs";
import { EmptyQuestionsState } from "./_components/empty-questions-state";
import { QuestionCard } from "./_components/question-card";
import { QuestionsSidebar } from "./_components/questions-sidebar";
import { QuizHeader } from "./_components/quiz-header";
import { QuizSettingsForm } from "./_components/quiz-settings-form";

export default function QuizEditPage() {
  const params = useParams();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);
  const [deleteAnswerId, setDeleteAnswerId] = useState<{
    questionId: number;
    answerId: number;
  } | null>(null);
  const t = useTranslations();

  const { data: course } = useQuery({
    queryKey: ["course", params.courseId],
    queryFn: async () => {
      const [response, error] = await attempt(
        getCourse(Number(params.courseId))
      );
      if (error) {
        toast.error(t("quizzes.errorFetchingCourse"));
        return;
      }
      return response;
    },
  });

  const { data: section } = useQuery({
    queryKey: ["section", params.sectionId],
    queryFn: async () => {
      const [response, error] = await attempt(
        findCourseSection(Number(params.courseId), Number(params.sectionId))
      );
      if (error) {
        toast.error(t("quizzes.errorFetchingSection"));
        return;
      }
      return response;
    },
  });

  const {
    data: lessonData,
    isLoading: isLessonLoading,
    isError: isLessonError,
  } = useQuery({
    queryKey: ["lesson", params.lessonId],
    queryFn: async () => {
      const [response, error] = await attempt(
        findLesson(
          Number(params.courseId),
          Number(params.sectionId),
          Number(params.lessonId)
        )
      );
      if (error) {
        toast.error(t("quizzes.errorFetchingLesson"));
        return;
      }
      return response;
    },
  });

  const {
    data: quizData,
    isLoading: isQuizLoading,
    isError: isQuizError,
  } = useQuery({
    queryKey: ["dashboard-quiz", params.quizId],
    queryFn: async () => {
      const [response, error] = await attempt(
        findQuiz(params.quizId as string)
      );
      if (error) {
        toast.error(t("quizzes.errorFetchingQuiz"));
      }
      console.log(response?.data);
      setQuestions(response?.data?.questions || []);
      return response?.data;
    },
  });

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      const [, error] = await attempt(deleteQuestion(questionId));
      if (error) {
        toast.error(t("quizzes.failedToDeleteQuestion"));
        return;
      }
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      toast.success(t("quizzes.questionDeletedSuccessfully"));
      setDeleteQuestionId(null);
    } catch (error) {
      toast.error(t("quizzes.failedToDeleteQuestion"));
    }
  };

  const handleDeleteAnswer = async (questionId: number, answerId: number) => {
    const [, error] = await attempt(deleteAnswer(answerId));
    if (error) {
      toast.error(t("quizzes.failedToDeleteAnswer"));
      return;
    }

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: q.answers.filter((a) => a.id !== answerId),
          };
        }
        return q;
      })
    );
    setDeleteAnswerId(null);
    toast.success(
      t("quizzes.answerDeletedSuccessfully") || "Answer deleted successfully"
    );
  };

  const handleUpdateQuestion = async (
    questionId: number,
    data: UpdateQuizQuestionDto
  ) => {
    try {
      const [response, error] = await attempt(updateQuestion(questionId, data));
      if (error) {
        toast.error(t("quizzes.failedToUpdateQuestion"));
        return;
      }
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? response.data! : q))
      );
    } catch (error) {
      toast.error(t("quizzes.failedToUpdateQuestion"));
    }
  };

  const handleAddAnswer = async (questionId: number) => {
    const [response, error] = await attempt(
      addAnswer(questionId, {
        answerText: t("quizzes.answerText"),
        isCorrect: false,
      })
    );
    if (error) {
      toast.error(t("quizzes.failedToAddAnswer"));
      return;
    }

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: [...q.answers, response.data!],
          };
        }
        return q;
      })
    );
  };

  const handleUpdateAnswer = async (
    questionId: number,
    answerId: number,
    data: Partial<QuizAnswer>
  ) => {
    const [, error] = await attempt(updateAnswer(answerId, data));
    if (error) {
      toast.error(t("quizzes.failedToUpdateAnswer"));
      return;
    }

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: q.answers.map((a) =>
              a.id === answerId ? { ...a, ...data } : a
            ),
          };
        }
        return q;
      })
    );
  };

  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null
  );

  if (isQuizLoading || isLessonLoading)
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  if (isQuizError || isLessonError) return <div>Error</div>;

  return (
    <div className="container mx-auto space-y-4">
      <QuizHeader
        courseTitle={course?.data?.title}
        lessonTitle={lessonData?.data?.title}
        questionLength={quizData?.questions.length || 0}
        quizId={params.quizId as string}
        sectionTitle={section?.data?.title}
        setQuestions={setQuestions}
      />

      {/* Quiz Settings Form */}
      {quizData && (
        <QuizSettingsForm
          initialData={{
            title: quizData.title,
            duration: quizData.duration,
            allowMultipleAttempts: quizData.allowMultipleAttempts ?? false,
          }}
          lessonId={Number(params.lessonId)}
          quizId={params.quizId as string}
        />
      )}

      {/* Main Content Area with Sidebar */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Questions Sidebar */}

        {/* Questions List */}
        <div className="lg:col-span-3">
          {questions && questions.length > 0 ? (
            <div className="space-y-6">
              {questions.map((question, questionIndex) => (
                <QuestionCard
                  isLoading={false}
                  key={question.id}
                  onAddAnswer={handleAddAnswer}
                  onDelete={(questionId) => setDeleteQuestionId(questionId)}
                  onDeleteAnswer={(questionId, answerId) =>
                    setDeleteAnswerId({ questionId, answerId })
                  }
                  onUpdateAnswer={handleUpdateAnswer}
                  question={question}
                  questionIndex={questionIndex}
                />
              ))}
            </div>
          ) : (
            <EmptyQuestionsState
              questionLength={quizData?.questions.length || 0}
              quizId={params.quizId as string}
              setQuestions={setQuestions}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <QuestionsSidebar
            isLoading={false}
            onQuestionSelect={setSelectedQuestionId}
            onQuestionsChange={setQuestions}
            questions={questions}
            selectedQuestionId={selectedQuestionId}
          />
        </div>
      </div>

      {/* Delete Dialogs */}
      <DeleteDialogs
        deleteAnswerId={deleteAnswerId}
        deleteQuestionId={deleteQuestionId}
        onCloseAnswerDialog={() => setDeleteAnswerId(null)}
        onCloseQuestionDialog={() => setDeleteQuestionId(null)}
        onDeleteAnswer={handleDeleteAnswer}
        onDeleteQuestion={handleDeleteQuestion}
      />
    </div>
  );
}
