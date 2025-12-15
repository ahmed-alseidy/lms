"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { UpdateQuizQuestionDto } from "@lms-saas/shared-lib/dtos";
import {
  IconArrowLeft,
  IconGripVertical,
  IconLoader,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  updateQuiz,
} from "@/lib/quizzes";
import { attempt } from "@/lib/utils";
import { AnswerEditForm } from "./_components/answer-edit-form";
import { QuestionDialog } from "./_components/question-dialog";
import { QuestionTitleForm } from "./_components/question-title-form";

export default function QuizEditPage() {
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
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
    queryKey: ["quiz", params.quizId],
    queryFn: async () => {
      const [response, error] = await attempt(
        findQuiz(params.quizId as string)
      );
      if (error) {
        toast.error(t("quizzes.errorFetchingQuiz"));
      }
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
    } catch (error) {
      toast.error(t("quizzes.failedToDeleteQuestion"));
    }
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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !questions) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (!reorderedItem) return;

    items.splice(result.destination.index, 0, reorderedItem);

    // Update the orderIndex for each question
    const updatedQuestions = items.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));

    const [, error] = await attempt(
      updateQuiz(Number(params.lessonId), params.quizId as string, {
        questions: updatedQuestions,
      })
    );
    if (error) {
      toast.error(t("quizzes.failedToUpdateQuestionOrder"));
      return;
    }

    setQuestions(updatedQuestions);
    toast.success(t("quizzes.questionOrderUpdated"));
    // Update the order in the backend
    try {
      setIsLoading(true);
      const [, error] = await attempt(
        updateQuestion(reorderedItem.id, {
          orderIndex: result.destination.index,
        })
      );
      if (error) {
        toast.error(t("quizzes.failedToUpdateQuestionOrder"));
        return;
      }
      toast.success(t("quizzes.questionOrderUpdated"));
      setIsLoading(false);
    } catch (error) {
      toast.error(t("quizzes.failedToUpdateQuestionOrder"));
    }
  };

  if (isQuizLoading || isLessonLoading)
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  if (isQuizError || isLessonError) return <div>Error</div>;

  return (
    <div className="container mx-auto space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/courses">
              {t("navigation.courses")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/courses/${params.courseId}`}>
              {course?.data?.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/courses/${params.courseId}/sections/${params.sectionId}`}
            >
              {section?.data?.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${params.lessonId}`}
            >
              {lessonData?.data?.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("quizzes.editQuizTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6 items-center justify-between md:flex">
        <div className="flex items-center gap-4">
          <Button
            className="h-8 w-8"
            onClick={() => router.back()}
            size="icon"
            variant="ghost"
          >
            <IconArrowLeft className="rotate-rtl h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("quizzes.editQuizTitle")}</h1>
            <p className="text-muted-foreground">
              {t("quizzes.editQuizDescription")}
            </p>
          </div>
        </div>
        <QuestionDialog
          questionLength={quizData?.questions.length || 0}
          quizId={params.quizId as string}
          setQuestions={setQuestions}
        />
      </div>

      <div className="space-y-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions" isDropDisabled={isLoading}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                className="space-y-4"
                ref={provided.innerRef}
              >
                {questions?.map((question, questionIndex) => (
                  <Draggable
                    draggableId={question.id.toString()}
                    index={questionIndex}
                    isDragDisabled={isLoading}
                    key={question.id}
                  >
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <Card
                          className={`hover:border-primary/50 shadow-none hover:shadow-sm ${isLoading ? "opacity-50" : ""}`}
                        >
                          <CardHeader className="bg-primary/5 border-b">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <IconGripVertical className="text-muted-foreground h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg">
                                  {t("quizzes.question")} {questionIndex + 1}:{" "}
                                  {question.questionText}
                                </CardTitle>
                              </div>
                              <Button
                                className="hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                  handleDeleteQuestion(question.id)
                                }
                                size="icon"
                                variant="ghost"
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4 pt-2">
                              <Accordion collapsible type="single">
                                <AccordionItem value="title">
                                  <AccordionTrigger className="text-sm font-medium">
                                    {t("quizzes.questionDetails")}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <QuestionTitleForm
                                      initialData={{
                                        questionText: question.questionText,
                                      }}
                                      questionId={question.id}
                                    />
                                    <Separator />
                                    <Accordion
                                      className="w-full"
                                      collapsible
                                      type="single"
                                    >
                                      <AccordionItem value="answers">
                                        <AccordionTrigger className="text-sm font-medium">
                                          {t("quizzes.answers")}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                          <div className="space-y-4">
                                            <div className="flex items-center justify-end">
                                              <Button
                                                className="gap-2"
                                                onClick={() =>
                                                  handleAddAnswer(question.id)
                                                }
                                                size="sm"
                                                variant="outline"
                                              >
                                                <IconPlus className="h-4 w-4" />
                                                {t("quizzes.addAnswer")}
                                              </Button>
                                            </div>

                                            <div className="space-y-4">
                                              {question.answers?.map(
                                                (answer, answerIndex) => (
                                                  <div
                                                    className="flex items-start justify-between gap-4 rounded-lg border p-4"
                                                    key={answer.id}
                                                  >
                                                    <AnswerEditForm
                                                      answerId={answer.id}
                                                      initialData={{
                                                        answerText:
                                                          answer.answerText,
                                                      }}
                                                    />
                                                    <div className="flex items-center gap-2 pt-8">
                                                      <div className="flex items-center gap-2">
                                                        <Checkbox
                                                          checked={
                                                            answer.isCorrect
                                                          }
                                                          id={`correct-${answer.id}`}
                                                          onCheckedChange={(
                                                            checked
                                                          ) =>
                                                            handleUpdateAnswer(
                                                              question.id,
                                                              answer.id,
                                                              {
                                                                isCorrect:
                                                                  checked ===
                                                                  true,
                                                              }
                                                            )
                                                          }
                                                        />
                                                        <Label
                                                          htmlFor={`correct-${answer.id}`}
                                                        >
                                                          {t("quizzes.correct")}
                                                        </Label>
                                                      </div>
                                                      <Button
                                                        onClick={() =>
                                                          handleDeleteAnswer(
                                                            question.id,
                                                            answer.id
                                                          )
                                                        }
                                                        size="icon"
                                                        variant="ghost"
                                                      >
                                                        <IconTrash className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    </Accordion>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {(!questions || questions.length === 0) && (
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
          </div>
        )}
      </div>
    </div>
  );
}
