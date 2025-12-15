"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { IconGripVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CourseSection,
  deleteLesson,
  updateCourseSection,
} from "@/lib/courses";
import { attempt } from "@/lib/utils";

type LessonsListProps = {
  course: any;
  sectionData: CourseSection;
  setSectionData: Dispatch<SetStateAction<CourseSection | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
};

export const LessonsList = ({
  sectionData,
  setSectionData,
  setIsLoading,
}: LessonsListProps) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const tLessons = useTranslations("lessons");

  async function handleDragEnd(result: any) {
    if (!result.destination || !sectionData) return;

    const { source, destination, type } = result;

    if (type === "lesson") {
      const lessons = [...sectionData.lessons];
      const [removed] = lessons.splice(source.index, 1);
      if (removed) {
        lessons.splice(destination.index, 0, removed);
        lessons.forEach((lesson, idx) => {
          lesson.orderIndex = idx;
        });

        setSectionData({
          ...sectionData,
          lessons,
        });

        try {
          setIsLoading(true);
          const [, error] = await attempt(
            updateCourseSection(
              Number(params.courseId),
              Number(params.sectionId),
              {
                title: sectionData.title,
                lessons: lessons.map((lesson) => ({
                  id: lesson.id,
                  title: lesson.title,
                  orderIndex: lesson.orderIndex,
                })),
              }
            )
          );

          if (error) {
            toast.error("Failed to update lesson order");
            // Revert changes on error
            setSectionData({
              ...sectionData,
              lessons: sectionData.lessons,
            });
          } else {
            toast.success("Lesson order updated");
            queryClient.invalidateQueries({
              queryKey: ["section", params.sectionId],
            });
          }
        } catch (error) {
          toast.error("Failed to update lesson order");
          // Revert changes on error
          setSectionData({
            ...sectionData,
            lessons: sectionData.lessons,
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  }

  async function removeLesson(lessonIndex: number, lessonId: number) {
    if (!sectionData) return;

    try {
      setIsLoading(true);
      const [, error] = await attempt(
        deleteLesson(
          Number(params.courseId),
          Number(params.sectionId),
          lessonId
        )
      );

      if (error) {
        toast.error("Failed to remove lesson");
        return;
      }

      const lessons = [...sectionData.lessons];
      lessons.splice(lessonIndex, 1);

      lessons.forEach((lesson, idx) => {
        lesson.orderIndex = idx;
      });

      setSectionData({
        ...sectionData,
        lessons,
      });
    } catch (error) {
      toast.error("Failed to remove lesson");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="lessons" type="lesson">
        {(provided) => (
          <div
            {...provided.droppableProps}
            className="space-y-3"
            ref={provided.innerRef}
          >
            {sectionData?.lessons.map((lesson, lessonIndex) => (
              <Draggable
                draggableId={`lesson-${lesson.id}`}
                index={lessonIndex}
                key={`lesson-${lesson.id}-${lessonIndex}`}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="bg-card rounded-lg border p-4 transition-all hover:shadow-md"
                  >
                    <div className="items-center justify-between space-y-2 md:flex md:space-y-0">
                      <div className="flex items-center gap-2">
                        <div
                          {...provided.dragHandleProps}
                          className="hover:bg-muted cursor-grab rounded-md p-1"
                        >
                          <IconGripVertical className="text-muted-foreground h-4 w-4" />
                        </div>
                        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                          <IconPencil className="text-primary h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lesson.title}</span>
                          <Badge variant="secondary">
                            {lesson.videos.length} {tLessons("videos")},{" "}
                            {lesson.quizzes.length} {tLessons("quizzes")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeLesson(lessonIndex, lesson.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() =>
                            router.push(
                              `/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${lesson.id}`
                            )
                          }
                          size="sm"
                          variant="outline"
                        >
                          {tLessons("editLesson")}
                        </Button>
                      </div>
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
  );
};
