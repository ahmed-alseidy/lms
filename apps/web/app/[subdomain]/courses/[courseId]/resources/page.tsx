"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, File, Loader } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCourse } from "@/lib/courses";
import {
  type CourseResource,
  getCourseResource,
  getCourseResources,
} from "@/lib/resources";
import { attempt } from "@/lib/utils";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export default function CourseResourcesPage() {
  const params = useParams();
  const courseId = Number(params.courseId);
  const router = useRouter();
  const t = useTranslations();

  const { data: courseResponse, isLoading: isCourseLoading } = useQuery({
    queryKey: ["student-course", courseId],
    queryFn: async () => {
      const [response, error] = await attempt(getCourse(courseId, true, true));
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return undefined;
      }
      return response;
    },
  });

  const course = courseResponse?.data;

  const { data: resources = [], isLoading: isResourcesLoading } = useQuery({
    queryKey: ["course-resources", courseId],
    queryFn: async () => {
      const [response, error] = await attempt(getCourseResources(courseId));
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return [];
      }
      return response?.data ?? [];
    },
    enabled: !!course?.enrollments?.[0],
  });

  const handleDownload = async (resource: CourseResource) => {
    const enrollmentId = course?.enrollments?.[0]?.id;
    const [response, error] = await attempt(
      getCourseResource(courseId, resource.id, enrollmentId)
    );
    if (error) {
      toast.error(t("common.somethingWentWrong"));
      return;
    }
    if (response?.data?.downloadUrl) {
      window.open(response.data.downloadUrl, "_blank");
    }
  };

  if (isCourseLoading || !course) {
    if (!isCourseLoading && !course) {
      router.replace("/courses");
      return null;
    }
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course.enrollments?.[0]) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <p className="text-muted-foreground mb-4">{t("courses.notEnrolled")}</p>
        <Link href={`/courses/${courseId}/enroll`}>
          <Button>{t("courses.enrollNow")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/courses">
              {t("courses.title")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/courses/${courseId}`}>
              {course.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("courses.resourceLibrary")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Link href={`/courses/${courseId}`}>
          <Button size="icon" variant="ghost">
            <ArrowLeft className="rotate-rtl h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("courses.resourceLibrary")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("courses.resourceLibraryDescription")}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isResourcesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : resources.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              {t("courses.noCourseResources")}
            </p>
          ) : (
            <div className="divide-y">
              {resources.map((resource) => (
                <div
                  className="flex items-center justify-between gap-4 p-4"
                  key={resource.id}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <File className="text-primary h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{resource.title}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {resource.fileName} • {formatSize(resource.fileSize)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(resource)}
                    size="sm"
                    variant="outline"
                  >
                    {t("common.download", { default: "Download" })}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
