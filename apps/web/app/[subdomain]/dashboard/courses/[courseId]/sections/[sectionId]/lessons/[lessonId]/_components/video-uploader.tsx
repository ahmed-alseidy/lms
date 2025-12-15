"use client";

import { IconUpload, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { transcodeToHLS } from "@/lib/transcode-video";
import { attempt } from "@/lib/utils";
import {
  createVideo,
  getUploadPresignedUrl,
  uploadVideo,
  Video as VideoInterface,
} from "@/lib/videos";

export const VideoUploader = ({
  lessonId,
  onUploadComplete,
}: {
  lessonId: number;
  onUploadComplete: (video: VideoInterface) => void;
}) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcodingProgress, setTranscodingProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const t = useTranslations("lessons");
  const tCommon = useTranslations("common");

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      return toast.error("Please upload a video file");
    }
    if (file.size > 500 * 1024 * 1024) {
      return toast.error("File size must be less than 500MB");
    }
    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".wmv"] },
    maxFiles: 1,
    disabled: isUploading || isTranscoding,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setIsTranscoding(true);
      setTranscodingProgress(0);

      // Transcode the video to HLS
      const [transcodeData, transcodeError] = await attempt(
        transcodeToHLS(selectedFile, setTranscodingProgress)
      );

      if (transcodeError) {
        toast.error("Failed to transcode video");
        setIsTranscoding(false);
        return;
      }

      const { manifest, segments } = transcodeData;

      setIsTranscoding(false);
      setIsUploading(true);
      setUploadProgress(0);

      const [videoDetails, videoDetailsError] = await attempt(
        createVideo(lessonId, {
          title: manifest.name,
        })
      );

      if (videoDetailsError || !videoDetails) {
        toast.error("Failed to create video");
        return;
      }

      const [manifestUploadData, manifestUploadError] = await attempt(
        getUploadPresignedUrl(lessonId, {
          key: videoDetails.data.manifestKey,
          contentType: manifest.type,
          expiresIn: 60 * 60 * 1000,
        })
      );

      if (manifestUploadError || !manifestUploadData) {
        toast.error("Failed to get upload URL");
        return;
      }

      // Upload manifest
      const [, error] = await attempt(
        uploadVideo(manifest, manifestUploadData.data, setUploadProgress)
      );
      if (error) {
        toast.error("Failed to upload manifest");
        return;
      }

      // Upload segments
      const segmentPromises = segments.map(async (segment, index) => {
        // Create a new File object with the correct content type
        const segmentFile = new File([segment], segment.name, {
          type: "video/mp2t",
        });

        const [segmentUploadData, segmentUploadError] = await attempt(
          getUploadPresignedUrl(lessonId, {
            key: `${videoDetails.data.segmentsKey}/${segment.name}`,
            contentType: "video/mp2t",
            expiresIn: 60 * 60 * 1000,
          })
        );

        if (segmentUploadError || !segmentUploadData) {
          toast.error("Failed to get segment upload URL");
          return;
        }

        const [, error] = await attempt(
          uploadVideo(segmentFile, segmentUploadData.data, () => {
            const segmentProgress = ((index + 1) / segments.length) * 100;
            setUploadProgress(segmentProgress);
          })
        );
        if (error) {
          toast.error("Failed to upload segment");
          return;
        }
      });

      await Promise.all(segmentPromises);

      const details = videoDetails.data;
      onUploadComplete({
        id: details.id,
        title: details.title,
        manifestKey: details.manifestKey,
        segmentsKey: details.segmentsKey,
      });

      queryClient.invalidateQueries({ queryKey: ["video-url", details.id] });

      toast.success(tCommon("updatedSuccessfully"));
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error(tCommon("somethingWentWrong"));
    } finally {
      setIsUploading(false);
      setIsTranscoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex h-[300px] w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <IconUpload className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            {isDragActive
              ? "Drop the video here"
              : "Drag & drop a video, or click to select"}
          </p>
          <p className="text-muted-foreground text-xs">
            Supported: MP4, MOV, AVI, WMV (max 500MB)
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-muted-foreground text-xs">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <Button
              disabled={isUploading || isTranscoding}
              onClick={() => setSelectedFile(null)}
              size="icon"
              variant="ghost"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>

          {isTranscoding ? (
            <div className="space-y-2">
              <Progress value={transcodingProgress} />
              <p className="text-muted-foreground text-center text-xs">
                Transcoding... {transcodingProgress}%
              </p>
            </div>
          ) : isUploading ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-muted-foreground text-center text-xs">
                Uploading... {uploadProgress}%
              </p>
            </div>
          ) : (
            <Button className="w-full" onClick={handleUpload}>
              {tCommon("upload")} {t("video")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
