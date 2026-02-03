"use client";

import { IconUpload, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  createLessonResource,
  getUploadPresignedUrl,
  LessonResource,
  uploadFile,
} from "@/lib/resources";
import { attempt } from "@/lib/utils";

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const ACCEPTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
};

export const LessonResourceUploader = ({
  lessonId,
  onUploadComplete,
}: {
  lessonId: number;
  onUploadComplete: (resource: LessonResource) => void;
}) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const t = useTranslations("lessons");
  const tCommon = useTranslations("common");

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    const mime = file.type;

    const isAccepted = Object.keys(ACCEPTED_TYPES).some((type) =>
      type === "image/*" ? mime.startsWith("image/") : mime === type
    );

    if (!isAccepted) {
      toast.error(
        "Unsupported file type. Allowed: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, images."
      );
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const key = `resources/lessons/${lessonId}/${Date.now()}-${selectedFile.name}`;

      const [presignedData, presignedError] = await attempt(
        getUploadPresignedUrl({
          key,
          contentType: selectedFile.type || "application/octet-stream",
          expiresIn: 60 * 60 * 1000,
        })
      );

      if (presignedError || !presignedData) {
        toast.error("Failed to get upload URL");
        return;
      }

      const [, uploadError] = await attempt(
        uploadFile(selectedFile, presignedData.data, setUploadProgress)
      );

      if (uploadError) {
        toast.error("Failed to upload file");
        return;
      }

      const [resource, createError] = await attempt(
        createLessonResource(lessonId, {
          title: selectedFile.name,
          fileKey: key,
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
          fileSize: String(selectedFile.size),
        })
      );

      if (createError || !resource) {
        toast.error("Failed to save resource");
        return;
      }

      onUploadComplete(resource.data);
      queryClient.invalidateQueries({
        queryKey: ["lesson-resources", lessonId],
      });

      toast.success(tCommon("updatedSuccessfully"));
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error(tCommon("somethingWentWrong"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex h-[220px] w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
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
              ? "Drop the file here"
              : "Drag & drop a resource, or click to select"}
          </p>
          <p className="text-muted-foreground text-xs">
            Allowed: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, images (max
            50MB)
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
              disabled={isUploading}
              onClick={() => setSelectedFile(null)}
              size="icon"
              variant="ghost"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>

          {isUploading ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-muted-foreground text-center text-xs">
                Uploading... {uploadProgress}%
              </p>
            </div>
          ) : (
            <Button className="w-full" onClick={handleUpload}>
              {tCommon("upload")} {t("resource", { default: "Resource" })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
