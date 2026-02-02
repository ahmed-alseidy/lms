import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Video } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeLesson } from "@/lib/courses";
import { attempt } from "@/lib/utils";
import { completeVideo } from "@/lib/videos";

export default function CompleteButton({
  lessonId,
  videoId,
  enrollmentId,
  isVideoCompleted,
}: {
  lessonId: number;
  videoId: string;
  enrollmentId: number;
  isVideoCompleted: boolean;
}) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const params = useParams();
  const courseId = Number(params.courseId);
  const sectionId = Number(params.sectionId);

  const { mutate: completeLessonMutation, isPending: isCompleteLessonPending } =
    useMutation({
      mutationFn: async () => {
        const [response, error] = await attempt(
          completeLesson(courseId, sectionId, lessonId, enrollmentId)
        );

        if (error) {
          toast.error(t("common.somethingWentWrong"));
          return;
        }

        return response?.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["video-completed", lessonId],
        });
        queryClient.invalidateQueries({
          queryKey: ["lesson-completed", lessonId],
        });
      },
    });

  const handleCompleteVideo = async () => {
    const [, error] = await attempt(
      completeVideo(lessonId, videoId, enrollmentId)
    );

    if (error) {
      toast.error(t("common.somethingWentWrong"));
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ["video-completed", lessonId],
    });

    queryClient.invalidateQueries({
      queryKey: ["lesson-completed", lessonId],
    });

    queryClient.invalidateQueries({
      queryKey: ["student-course", courseId],
    });

    toast.success(t("lessons.videoCompleted"));
  };

  return (
    <Button disabled={isVideoCompleted} onClick={handleCompleteVideo}>
      {isVideoCompleted ? (
        <CheckCircle className="text-primary-foreground h-3 w-3" />
      ) : (
        <Video className="h-3 w-3" />
      )}
      {isVideoCompleted ? t("lessons.completed") : t("lessons.markCompleted")}
    </Button>
  );
}
