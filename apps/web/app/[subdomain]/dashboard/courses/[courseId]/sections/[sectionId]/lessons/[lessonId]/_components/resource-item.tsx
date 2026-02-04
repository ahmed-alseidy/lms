import { IconDownload, IconFile, IconTrash } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteLessonResource,
  getLessonResource,
  getResourceDownloadStats,
  LessonResource,
} from "@/lib/resources";
import { attempt } from "@/lib/utils";

export const ResourceItem = ({ resource }: { resource: LessonResource }) => {
  const tCommon = useTranslations("common");
  const t = useTranslations("courses");
  const queryClient = useQueryClient();

  const { data: downloadStats = [] } = useQuery({
    queryKey: ["resource-downloads", resource.id, "lesson"],
    queryFn: async () => {
      const [res, err] = await attempt(
        getResourceDownloadStats(resource.id, "lesson")
      );
      if (err) return [];
      return res?.data ?? [];
    },
  });

  const downloadCount = downloadStats.length;
  const uniqueStudents = new Set(downloadStats.map((d) => d.enrollmentId)).size;

  const handleResourceDownload = async () => {
    console.log(resource);
    if (!resource.id) return;
    if (!resource.lessonId) return;
    const [response, error] = await attempt(
      getLessonResource(resource.lessonId, resource.id)
    );
    if (error) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }
    window.open(response.data.downloadUrl, "_blank");
  };

  const handleResourceDelete = async (resourceId: string) => {
    const [, error] = await attempt(
      deleteLessonResource(resource.lessonId, resourceId)
    );
    if (error) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }
    toast.success(tCommon("deletedSuccessfully"));
    queryClient.invalidateQueries({
      queryKey: ["lesson-resources", resource.lessonId],
    });
  };

  return (
    <div
      className="flex items-center justify-between rounded-lg border p-4"
      key={resource.id}
    >
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
          <IconFile className="text-primary h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-medium">{resource.title}</h3>
          <p className="text-muted-foreground text-sm">
            {resource.fileName} • {(resource.fileSize / 1024 / 1024).toFixed(2)}{" "}
            MB
          </p>

          {downloadCount > 0 && (
            <div className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <IconDownload className="h-3.5 w-3.5" />
              {t("downloadStats", {
                count: downloadCount,
                students: uniqueStudents,
              })}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={handleResourceDownload} size="sm" variant="outline">
          {tCommon("download", { default: "Download" })}
        </Button>
        <Button
          className="hover:bg-destructive/10 hover:text-destructive"
          onClick={() => handleResourceDelete(resource.id)}
          size="icon"
          variant="ghost"
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
