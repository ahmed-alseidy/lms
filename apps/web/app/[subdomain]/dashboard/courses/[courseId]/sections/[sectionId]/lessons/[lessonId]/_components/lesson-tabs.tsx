import {
  IconFile,
  IconFileInfo,
  IconLoader,
  IconTrash,
  IconVideo,
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lesson } from "@/lib/courses";
import { deleteQuiz, findQuiz, Quiz } from "@/lib/quizzes";
import { getLessonResources, LessonResource } from "@/lib/resources";
import { attempt } from "@/lib/utils";
import { deleteVideo, Video as VideoInterface } from "@/lib/videos";
import { CreateQuizDialog } from "./create-quiz-dialog";
import { LessonResourceUploader } from "./lesson-resource-uploader";
import { ResourceItem } from "./resource-item";
import { VideoPreview } from "./video-preview";
import { VideoUploader } from "./video-uploader";

type LessonTabsProps = {
  lesson: Lesson;
};

export const LessonTabs = ({ lesson }: LessonTabsProps) => {
  const params = useParams();
  const router = useRouter();
  const [lessonVideos, setLessonVideos] = useState(lesson.videos);
  const [lessonQuizzes, setLessonQuizzes] = useState(lesson.quizzes);

  const t = useTranslations("lessons");
  const tCommon = useTranslations("common");

  const queryClient = useQueryClient();

  const {
    data: resourcesData,
    isLoading: isResourcesLoading,
    isError: isResourcesError,
  } = useQuery({
    queryKey: ["lesson-resources", lesson.id],
    queryFn: async () => {
      const [response, error] = await attempt(getLessonResources(lesson.id));
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
        return [];
      }
      return response.data;
    },
  });

  const {
    data: quizData,
    isLoading: isQuizLoading,
    isError: isQuizError,
  } = useQuery({
    queryKey: ["quiz", lesson.quizzes[0]?.id],
    queryFn: async () => {
      if (!lesson.quizzes[0]?.id) {
        return { questions: [] };
      }
      const [response, error] = await attempt(findQuiz(lesson.quizzes[0]?.id));
      if (error) {
        toast.error(error.message);
        return { questions: [] };
      }
      return response.data;
    },
  });

  const handleVideoUploadComplete = (video: VideoInterface) => {
    setLessonVideos([...lessonVideos, video]);
  };

  const handleVideoDelete = async (videoIndex: number, id: string) => {
    if (!id) return;
    const [, error] = await attempt(deleteVideo(lesson.id, id));
    if (error) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }
    const videos = [...lessonVideos];
    videos.splice(videoIndex, 1);
    setLessonVideos(videos);
  };

  const handleQuizDelete = async (quizIndex: number, id: string) => {
    const [, error] = await attempt(deleteQuiz(lesson.id, id));
    if (error) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }
    const quizzes = [...lessonQuizzes];
    quizzes.splice(quizIndex, 1);
    setLessonQuizzes(quizzes);
    toast.success(tCommon("deletedSuccessfully"));
  };

  const handleQuizCreated = (quiz: Quiz) => {
    setLessonQuizzes([...lessonQuizzes, quiz]);
    toast.success(tCommon("createdSuccessfully"));
  };

  const handleResourceUploadComplete = (_resource: LessonResource) => {
    // React Query will refetch; nothing else needed here
    queryClient.invalidateQueries({
      queryKey: ["lesson-resources", lesson.id],
    });
  };

  if (isQuizLoading || isResourcesLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );

  if (isQuizError || isResourcesError)
    return <div>{tCommon("somethingWentWrong")}</div>;

  return (
    <Tabs className="w-full" defaultValue="videos">
      <TabsList className="mb-4">
        <TabsTrigger className="gap-2" value="videos">
          <IconVideo className="h-4 w-4" />
          {t("videos")}
        </TabsTrigger>

        <TabsTrigger className="gap-2" value="resources">
          <IconFile className="h-4 w-4" />
          {tCommon("resources", { default: "Resources" })}
        </TabsTrigger>

        <TabsTrigger className="gap-2" value="quizzes">
          <IconFileInfo className="h-4 w-4" />
          {t("quizzes")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="videos">
        <div className="space-y-4">
          {lessonVideos.map((video, videoIndex) => (
            <VideoPreview
              key={`video-${video.id}`}
              lessonId={lesson.id}
              onDelete={() => handleVideoDelete(videoIndex, video.id)}
              title={video.title}
              videoId={video.id}
            />
          ))}

          {lessonVideos.length === 0 && (
            <VideoUploader
              lessonId={lesson.id}
              onUploadComplete={handleVideoUploadComplete}
            />
          )}
        </div>
      </TabsContent>

      <TabsContent value="resources">
        <div className="space-y-4">
          {isResourcesLoading && (
            <div className="flex h-full items-center justify-center">
              <IconLoader className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}

          {isResourcesError && (
            <p className="text-destructive text-sm">
              {tCommon("somethingWentWrong")}
            </p>
          )}

          {!isResourcesLoading &&
            resourcesData?.map((resource) => (
              <ResourceItem
                key={resource.id}
                resource={resource}
              />
            ))}

          <LessonResourceUploader
            lessonId={lesson.id}
            onUploadComplete={handleResourceUploadComplete}
          />
        </div>
      </TabsContent>

      <TabsContent value="quizzes">
        <div className="space-y-4">
          {lessonQuizzes?.map((quiz, quizIndex) => (
            <div
              className="flex items-center justify-between rounded-lg border p-4"
              key={`quiz-${quiz.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <IconFileInfo className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{quiz.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {quizData?.questions.length || 0} {tCommon("questions")} •{" "}
                    {quiz.duration} {tCommon("minutes")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    router.push(
                      `/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${params.lessonId}/quizzes/${quiz.id}`
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  {tCommon("edit")}
                </Button>
                <Button
                  className="hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleQuizDelete(quizIndex, quiz.id)}
                  size="icon"
                  variant="ghost"
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {lessonQuizzes?.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <IconFileInfo className="text-primary h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium">{t("noQuizzesYet")}</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {t("createQuizToTestYourStudentsKnowledge")}
              </p>
              <CreateQuizDialog
                lessonId={lesson.id}
                onQuizCreated={handleQuizCreated}
                quizzesNumber={lessonQuizzes.length || 0}
              />
            </div>
          ) : (
            <div className="flex justify-end">
              <CreateQuizDialog
                lessonId={lesson.id}
                onQuizCreated={handleQuizCreated}
                quizzesNumber={lessonQuizzes.length || 0}
              />
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};
