"use client";

import { IconFile, IconTrash } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CourseResource,
  deleteCourseResource,
  getCourseResource,
} from "@/lib/resources";
import { attempt } from "@/lib/utils";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export function CourseResourceItem({
  resource,
  courseId,
}: {
  resource: CourseResource;
  courseId: number;
}) {
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  const handleDownload = async () => {
    const [response, error] = await attempt(
      getCourseResource(courseId, resource.id)
    );
    if (error) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }
    window.open(response?.data?.downloadUrl, "_blank");
  };

  const handleDelete = async () => {
    const [, error] = await attempt(
      deleteCourseResource(courseId, resource.id)
    );
    if (error) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }
    toast.success(tCommon("deletedSuccessfully"));
    queryClient.invalidateQueries({
      queryKey: ["course-resources", courseId],
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
          <IconFile className="text-primary h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">{resource.title}</h3>
          <p className="text-muted-foreground text-sm">
            {resource.fileName} • {formatSize(resource.fileSize)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={handleDownload} size="sm" variant="outline">
          {tCommon("download", { default: "Download" })}
        </Button>
        <Button
          className="hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDelete}
          size="icon"
          variant="ghost"
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
