import { IconLoader, IconTrash, IconVideo } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VideoJsPlayer } from "@/components/video-js-player";
import { attempt } from "@/lib/utils";
import { getVideo } from "@/lib/videos";

interface VideoPreviewProps {
  lessonId: number;
  videoId: string;
  title: string;
  onDelete?: () => void;
}

export const VideoPreview = ({
  videoId,
  title,
  onDelete,
  lessonId,
}: VideoPreviewProps) => {
  const {
    data: videoData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["video-url", videoId],
    queryFn: async () => {
      const [response, error] = await attempt(getVideo(lessonId, videoId));
      if (error) {
        toast.error("Failed to fetch video URL");
        return;
      }
      return response;
    },
  });

  const t = useTranslations("lessons");
  const tCommon = useTranslations("common");

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  if (isError) return <div>{tCommon("somethingWentWrong")}</div>;
  if (!videoData) return <div>{tCommon("somethingWentWrong")}</div>;

  const video = videoData.data;

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
        <VideoJsPlayer
          className="h-full w-full"
          poster="/video-placeholder.png"
          src={video.manifestUrl}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconVideo className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {onDelete && (
          <Button
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            size="sm"
            variant="ghost"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            {tCommon("delete")} {t("video")}
          </Button>
        )}
      </div>
    </div>
  );
};
