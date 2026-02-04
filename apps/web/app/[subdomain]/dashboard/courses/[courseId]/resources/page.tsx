"use client";

import { IconArrowLeft, IconFile, IconLoader } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { notFound, redirect, useParams, useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourse } from "@/lib/courses";
import { type CourseResource, getCourseResources } from "@/lib/resources";
import { attempt } from "@/lib/utils";
import { CourseResourceItem } from "./_components/course-resource-item";
import { CourseResourceUploader } from "./_components/course-resource-uploader";

export default function CourseResourcesPage() {
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const params = useParams();
  const courseId = Number.parseInt(params.courseId as string);
  const queryClient = useQueryClient();

  if (isNaN(courseId)) {
    notFound();
  }

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ["dashboard-course", courseId],
    queryFn: async () => {
      const [response, error] = await attempt(
        getCourse(courseId, true, false, true)
      );
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
        return undefined;
      }
      return response?.data;
    },
  });

  const { data: resources, isLoading: isResourcesLoading } = useQuery({
    queryKey: ["course-resources", courseId],
    queryFn: async () => {
      const [response, error] = await attempt(getCourseResources(courseId));
      console.log("response", response?.data);
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
        return [];
      }
      return response?.data ?? [];
    },
  });

  const handleUploadComplete = (_resource: CourseResource) => {
    queryClient.invalidateQueries({
      queryKey: ["course-resources", courseId],
    });
  };

  if (isCourseLoading || !course) {
    if (!isCourseLoading && !course) redirect("/dashboard/courses");
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const router = useRouter();

  return (
    <div className="container mx-auto">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/courses">
              {t("title")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/courses/${courseId}`}>
              {course.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("resourceLibrary")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/courses/${params.courseId}`}>
            <Button size="icon" variant="ghost">
              <IconArrowLeft className="rotate-rtl h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("resourceLibrary")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("resourceLibraryDescription")}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconFile className="h-5 w-5" />
              {t("resourceLibraryFiles")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isResourcesLoading ? (
              <div className="flex justify-center py-8">
                <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : resources && resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <CourseResourceItem
                    courseId={courseId}
                    key={resource.id}
                    resource={resource}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t("noCourseResources")}
              </p>
            )}

            <div className="border-t pt-4">
              <CourseResourceUploader
                courseId={courseId}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
