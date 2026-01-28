"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  List,
  Loader,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCourse } from "@/lib/courses";
import { attempt } from "@/lib/utils";

export default function CoursePage() {
  const params = useParams();
  const courseId = Number(params.courseId);

  const t = useTranslations();

  const { data: courseResponse, isLoading } = useQuery({
    queryKey: ["student-course", courseId],
    queryFn: async () => {
      const [response, error] = await attempt(getCourse(courseId, true, true));
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return;
      }
      return response;
    },
  });

  const course = courseResponse?.data.data;

  if (isLoading || !course) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course.enrollments?.[0]) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold">{t("courses.notEnrolled")}</h1>
        <Link href={`/courses/${courseId}/enroll`}>
          <Button>{t("courses.enrollNow")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-4 px-4 py-8">
      <Link
        className={buttonVariants({ variant: "outline" })}
        href={`/courses`}
      >
        <ArrowLeft className="rotate-rtl h-4 w-4" />
        {t("courses.backToCourses")}
      </Link>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex flex-1 flex-col gap-4">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground mt-2">
                {course.description || t("courses.noDescriptionAvailable")}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course.studentsCount || 0}
                <span>{t("courses.students")}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {course.lessonsCount || 0}
                <span>{t("courses.lessons")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{t("courses.rating")}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
              <span>{t("courses.yourProgress")}</span>
              <span>{course.enrollments[0].progress}%</span>
            </div>
            <div className="bg-secondary h-2 w-full rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${course.enrollments[0].progress}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="w-full md:w-[350px]">
          <CardHeader className="relative p-0">
            <div className="relative h-48">
              {course.imageUrl ? (
                <Image
                  alt={course.title}
                  className="h-full w-full object-cover"
                  fill
                  src={course.imageUrl}
                />
              ) : (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <BookOpen className="text-muted-foreground h-12 w-12" />
                </div>
              )}
            </div>
            <div className="absolute top-2 right-2">
              <Badge
                className="border-border border backdrop-blur-sm"
                variant="secondary"
              >
                ${course.price}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Separator />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <List className="text-primary h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">
                {t("courses.courseContent")}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              {course.courseSections?.length || 0} {t("courses.chapters")} •{" "}
              {course.courseSections?.reduce(
                (acc, section) => acc + (section.lessons?.length || 0),
                0
              )}{" "}
              {t("courses.lessons")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {course.courseSections?.map((section) => (
            <Card className="overflow-hidden gap-0" key={section.id}>
              <CardHeader className="bg-muted/50 p-4">
                <h3 className="font-semibold">{section.title}</h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {section.lessons?.map((lesson) => (
                    <Link
                      className="hover:bg-muted/50 flex items-center justify-between p-4 transition-colors"
                      href={`/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}`}
                      key={lesson.id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                          <BookOpen className="text-primary h-4 w-4" />
                        </div>
                        <span>{lesson.title}</span>
                      </div>
                      <ChevronRight className="text-muted-foreground rotate-rtl h-4 w-4" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
