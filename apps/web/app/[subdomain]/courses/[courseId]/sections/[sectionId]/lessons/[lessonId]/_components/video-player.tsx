import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { MuxVideoPlayer } from "@/components/mux-player";
import { VideoJsPlayer } from "@/components/video-js-player";
import { Lesson } from "@/lib/courses";
import { attempt } from "@/lib/utils";
import { getVideo } from "@/lib/videos";

export const VideoPlayer = ({ lesson }: { lesson: Lesson }) => {
  const {
    data: videoResponse,
    isLoading: videoLoading,
    isError,
  } = useQuery({
    queryKey: ["video", lesson.id, lesson?.videos[0]?.id],
    queryFn: async () => {
      const [response, error] = await attempt(
        getVideo(lesson.id, lesson?.videos[0]?.id || "")
      );
      if (error) {
        toast.error("Failed to fetch video URL");
        return;
      }
      return response;
    },
  });

  if (videoLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );

  if (isError) return <div>Error loading video</div>;

  const video = videoResponse?.data;

  return (
    <div className="flex w-full items-center justify-center bg-black">
      {video?.videoType === "mux" && video.muxPlaybackId ? (
        <MuxVideoPlayer playbackId={video.muxPlaybackId} />
      ) : (
        <VideoJsPlayer className="w-full" src={video?.manifestUrl ?? ""} />
      )}
    </div>
  );
};
