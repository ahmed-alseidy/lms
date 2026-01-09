"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { IconGripVertical } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuizQuestion, updateQuestion } from "@/lib/quizzes";
import { attempt, cn } from "@/lib/utils";

interface QuestionsSidebarProps {
  questions: QuizQuestion[];
  isLoading: boolean;
  onQuestionsChange: (questions: QuizQuestion[]) => void;
  onQuestionSelect?: (questionId: number) => void;
  selectedQuestionId?: number | null;
}

export function QuestionsSidebar({
  questions,
  isLoading,
  onQuestionsChange,
  onQuestionSelect,
  selectedQuestionId,
}: QuestionsSidebarProps) {
  const t = useTranslations();

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

    // Update local state optimistically
    onQuestionsChange(updatedQuestions);

    // Update all questions' orderIndex in the backend
    try {
      // Update all questions that changed order
      const updatePromises = updatedQuestions.map((question, index) =>
        updateQuestion(question.id, {
          orderIndex: index,
        })
      );

      const results = await Promise.all(
        updatePromises.map((promise) => attempt(promise))
      );

      const hasError = results.some(([, error]) => error);
      if (hasError) {
        // Revert to original order on error
        onQuestionsChange(questions);
        toast.error(t("quizzes.failedToUpdateQuestionOrder"));
        return;
      }

      toast.success(t("quizzes.questionOrderUpdated"));
    } catch (error) {
      // Revert to original order on error
      onQuestionsChange(questions);
      toast.error(t("quizzes.failedToUpdateQuestionOrder"));
    }
  };

  return (
    <Card className="w-full">
      <div className="border-b p-4">
        <h3 className="font-semibold">{t("quizzes.questions")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("quizzes.dragToReorder") || "Drag to reorder questions"}
        </p>
      </div>
      <ScrollArea className="h-80">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions-sidebar" isDropDisabled={isLoading}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                className="space-y-2 p-4"
                ref={provided.innerRef}
              >
                {questions.map((question, index) => (
                  <Draggable
                    draggableId={`sidebar-${question.id}`}
                    index={index}
                    isDragDisabled={isLoading}
                    key={question.id}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group flex items-start gap-2 rounded-lg border p-3 transition-colors ${
                          selectedQuestionId === question.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50 hover:bg-accent hover:text-primary-foreground"
                        } ${snapshot.isDragging ? "shadow-lg" : ""} ${
                          isLoading ? "opacity-50" : ""
                        }`}
                        onClick={() => onQuestionSelect?.(question.id)}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className={cn(
                            "cursor-grab active:cursor-grabbing text-muted-foreground mt-0.5",
                            selectedQuestionId === question.id
                              ? "hover:text-muted-foreground"
                              : "hover:text-primary-foreground"
                          )}
                        >
                          <IconGripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs font-medium">
                              {index + 1}
                            </span>
                            <p className="text-sm line-clamp-2">
                              {question.questionText}
                            </p>
                          </div>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {question.answers?.length || 0}{" "}
                            {t("quizzes.answers")}
                          </p>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {questions.length === 0 && (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {t("quizzes.noQuestionsYet")}
            </p>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
