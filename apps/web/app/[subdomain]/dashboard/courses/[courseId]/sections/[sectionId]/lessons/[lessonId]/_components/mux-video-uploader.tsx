"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { IconLoader } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { attempt } from "@/lib/utils";
import {
  createMuxUpload,
  getVideo,
  Video as VideoInterface,
} from "@/lib/videos";

export const MuxVideoUploader = ({
  lessonId,
  onUploadComplete,
}: {
  lessonId: number;
  onUploadComplete: (video: VideoInterface) => void;
}) => {
  const queryClient = useQueryClient();
  const tCommon = useTranslations("common");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeUpload = async () => {
    setIsInitializing(true);
    const [result, error] = await attempt(
      createMuxUpload(lessonId, { title: `Video ${new Date().toISOString()}` })
    );

    if (error || !result) {
      toast.error(tCommon("somethingWentWrong"));
      setIsInitializing(false);
      return;
    }

    setUploadUrl(result.data.uploadUrl);
    setVideoId(result.data.videoId);
    setIsInitializing(false);
  };

  const handleUploadSuccess = async () => {
    if (!videoId) return;
    setIsPolling(true);

    const poll = async () => {
      const [response, error] = await attempt(getVideo(lessonId, videoId));
      if (error || !response) {
        toast.error("Failed to check video status");
        setIsPolling(false);
        return;
      }

      const video = response.data;
      if (video.muxStatus === "ready") {
        setIsPolling(false);
        queryClient.invalidateQueries({ queryKey: ["video-url", videoId] });
        onUploadComplete({
          id: video.videoId,
          title: "Mux Video",
          videoType: "mux",
          muxPlaybackId: video.muxPlaybackId,
          muxStatus: video.muxStatus,
        });
        toast.success(tCommon("updatedSuccessfully"));
      } else if (video.muxStatus === "errored") {
        setIsPolling(false);
        toast.error("Video processing failed");
      } else {
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  if (isInitializing) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed">
        <div className="flex flex-col items-center gap-2">
          <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Preparing upload...</p>
        </div>
      </div>
    );
  }

  if (isPolling) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed">
        <div className="flex flex-col items-center gap-2">
          <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Processing video...</p>
        </div>
      </div>
    );
  }

  if (!uploadUrl) {
    return (
      <div
        className="flex h-[300px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary/50"
        onClick={initializeUpload}
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground text-sm">
            Click to start Mux upload
          </p>
          <p className="text-muted-foreground text-xs">
            Upload directly to Mux for high-quality streaming
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MuxUploader
        endpoint={uploadUrl}
        onError={() => toast.error("Upload failed")}
        onSuccess={handleUploadSuccess}
        style={{ height: "300px", width: "100%" }}
      />
    </div>
  );
};
