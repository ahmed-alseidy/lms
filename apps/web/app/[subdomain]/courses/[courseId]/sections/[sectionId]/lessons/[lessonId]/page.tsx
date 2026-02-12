"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import purify from "dompurify";
import { useAtom } from "jotai";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  File as FileIcon,
  Loader,
  Lock,
  Menu,
  Play,
  VideoOffIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localeAtom } from "@/lib/atoms";
import {
  checkPreviousLessonCompleted,
  checkPreviousSectionCompleted,
  findLesson,
  getCourse,
} from "@/lib/courses";
import { lexicalToHtml } from "@/lib/lexical-to-html";
import {
  getLessonResource,
  getLessonResources,
  LessonResource,
} from "@/lib/resources";
import { attempt } from "@/lib/utils";
import { checkIfVideoCompleted } from "@/lib/videos";
import CompleteButton from "./_components/complete-button";
import { MobileSidebar } from "./_components/mobile-sidebar";
import { SidebarContent } from "./_components/sidebar-content";
import { VideoPlayer } from "./_components/video-player";

export default function LessonPage() {
  const queryClient = useQueryClient();
  const params = useParams();
  const courseId = Number(params.courseId);
  const sectionId = Number(params.sectionId);
  const lessonId = Number(params.lessonId);
  const [blur, setBlur] = useState(false);
  const [locale] = useAtom(localeAtom);
  const t = useTranslations();

  const { data: courseResponse, isLoading: courseLoading } = useQuery({
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

  const { data: lessonResponse, isLoading: lessonLoading } = useQuery({
    queryKey: ["lesson", courseId, sectionId, lessonId],
    queryFn: async () => {
      const [response, error] = await attempt(
        findLesson(courseId, sectionId, lessonId)
      );
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return;
      }
      return response;
    },
  });

  const course = courseResponse?.data;
  const lesson = lessonResponse?.data;

  const {
    data: lessonResourcesData,
    isLoading: lessonResourcesLoading,
    isError: lessonResourcesError,
  } = useQuery({
    queryKey: ["lesson-resources", lessonId],
    queryFn: async () => {
      const [response, error] = await attempt(getLessonResources(lessonId));
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return [];
      }
      return response?.data ?? [];
    },
    enabled: !!lessonId,
  });

  const lessonResources: LessonResource[] = lessonResourcesData ?? [];

  const { data: isVideoCompleted, isLoading: isVideoLoading } = useQuery({
    queryKey: ["video-completed", lessonId],
    queryFn: async () => {
      if (!lesson?.videos?.[0]?.id) return { completed: false };

      const [response, error] = await attempt(
        checkIfVideoCompleted(
          lessonId,
          lesson?.videos?.[0]?.id!,
          course?.enrollments?.[0]?.id!
        )
      );
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return;
      }
      return response?.data;
    },

    enabled: !!lesson?.videos?.[0]?.id && !!course?.enrollments?.[0]?.id,
  });

  const {
    data: isPreviousSectionCompleted,
    isLoading: isPreviousSectionCompletedLoading,
  } = useQuery({
    queryKey: ["previous-section-completed", sectionId],
    queryFn: async () => {
      const [response, error] = await attempt(
        checkPreviousSectionCompleted(
          courseId,
          sectionId,
          course?.enrollments?.[0]?.id!
        )
      );
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return;
      }
      return response?.data;
    },
    enabled: !!course?.enrollments?.[0]?.id,
  });

  const {
    data: isPreviousLessonCompleted,
    isLoading: isPreviousLessonCompletedLoading,
  } = useQuery({
    queryKey: ["previous-lesson-completed", lessonId],
    queryFn: async () => {
      const [response, error] = await attempt(
        checkPreviousLessonCompleted(
          courseId,
          sectionId,
          lessonId,
          course?.enrollments?.[0]?.id!
        )
      );
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return;
      }
      return response?.data;
    },
    enabled: !!course?.enrollments?.[0]?.id,
  });

  const handleDownloadResource = async (resourceId: string) => {
    if (!course?.enrollments?.[0]?.id) {
      toast.error(t("common.somethingWentWrong"));
      return;
    }

    const enrollmentId = course.enrollments[0].id;

    const [response, error] = await attempt(
      getLessonResource(lessonId, resourceId, enrollmentId)
    );

    if (error || !response) {
      toast.error(t("common.somethingWentWrong"));
      return;
    }

    const url = response.data.downloadUrl;
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error(t("common.somethingWentWrong"));
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    const handleKeyDown = (e: KeyboardEvent) => {
      navigator.clipboard.writeText("");
      setBlur(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", () => setBlur(true));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        setBlur(true);
      }
    });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      setBlur(false);
    };
  }, []);

  const nav = useMemo(() => {
    if (!course) return { prev: null, next: null };
    let prev = null,
      next = null,
      found = false;
    for (const section of course.courseSections || []) {
      for (const l of section.lessons || []) {
        if (found && !next) next = { sectionId: section.id, lessonId: l.id };
        if (l.id === lessonId) found = true;
        if (!found) prev = { sectionId: section.id, lessonId: l.id };
      }
    }
    return { prev, next };
  }, [course, lessonId]);

  if (
    courseLoading ||
    lessonLoading ||
    isVideoLoading ||
    isPreviousSectionCompletedLoading ||
    isPreviousLessonCompletedLoading ||
    !course ||
    !lesson
  ) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Sheet>
      <div
        className="flex h-full min-h-screen w-full bg-linear-to-br from-background via-background to-muted/20"
        onClick={() => setBlur(false)}
        style={{
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          userSelect: "none",
        }}
      >
        {/* Enhanced Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-96 border-r border-border/50 bg-card/50 backdrop-blur-sm xl:block">
          <div className="flex h-full flex-col">
            {/* Course Header */}
            <div className="border-b border-border/50 p-4">
              <div className="flex items-start gap-3">
                {course.imageUrl ? (
                  <div className="relative overflow-hidden rounded-xl ring-2 ring-primary/20">
                    <Image
                      alt={course.title}
                      className="object-cover"
                      height={60}
                      src={course.imageUrl}
                      width={60}
                    />
                  </div>
                ) : (
                  <div className="flex h-[60px] w-[60px] items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-primary/20">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <h2 className="text-lg font-bold leading-tight text-foreground">
                    {course.title}
                  </h2>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {course.description || t("courses.noDescriptionAvailable")}
                  </p>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mt-4 space-y-3 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {t("courses.yourProgress")}
                  </span>
                  <Badge className="font-semibold" variant="secondary">
                    {course.enrollments?.[0]?.progress.toFixed(0) || "0"}%
                  </Badge>
                </div>
                <Progress
                  className="h-2 bg-background"
                  value={
                    Number(course.enrollments?.[0]?.progress.toFixed(0)) || 0
                  }
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {course.enrollments?.[0]?.studentLessonCompletions.length}{" "}
                    {t("lessons.completed")}
                  </span>
                  <span>
                    {course.enrollments?.[0]?.studentLessonCompletions.length}/
                    {course.lessonsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="flex-1 overflow-y-auto p-2">
              <SidebarContent course={course} lessonId={lessonId} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Top Navigation Bar */}
          <div className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-2">
                <div className="xl:hidden">
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Menu className="h-4 w-4" />
                      <span className="ml-2">{t("courses.courseContent")}</span>
                    </Button>
                  </SheetTrigger>
                </div>
                <Link href="/courses">
                  <Button size="sm" variant="ghost">
                    <ChevronLeft className="h-4 w-4 rotate-rtl" />
                    <span className="ml-1">{t("courses.backToCourses")}</span>
                  </Button>
                </Link>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                {nav.prev && (
                  <Link
                    href={`/courses/${courseId}/sections/${nav.prev.sectionId}/lessons/${nav.prev.lessonId}`}
                  >
                    <Button size="sm" variant="outline">
                      <ChevronLeft className="h-4 w-4 rotate-rtl" />
                    </Button>
                  </Link>
                )}
                {nav.next && (
                  <Link
                    href={`/courses/${courseId}/sections/${nav.next.sectionId}/lessons/${nav.next.lessonId}`}
                  >
                    <Button size="sm" variant="outline">
                      <ChevronRight className="h-4 w-4 rotate-rtl" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
            {!isPreviousSectionCompleted?.completed ||
            !isPreviousLessonCompleted?.completed ? (
              <Alert
                className="border-2 border-destructive/50 bg-destructive/5 flex flex-col gap-2"
                dir={locale === "ar" ? "rtl" : "ltr"}
                variant="destructive"
              >
                <AlertTitle
                  className={`text-base font-semibold flex items-center gap-2`}
                >
                  <Lock size={18} />
                  {t("courses.previousSectionNotCompleted")}
                </AlertTitle>
                <AlertDescription className={`mt-2`}>
                  {t("courses.previousSectionNotCompletedDescription")}
                </AlertDescription>
                {nav.prev && (
                  <div className="mt-4">
                    <Link
                      href={`/courses/${courseId}/sections/${nav.prev.sectionId}/lessons/${nav.prev.lessonId}`}
                    >
                      <Button
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        size="sm"
                        variant="outline"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4 rotate-rtl" />
                        {t("courses.goToPreviousSection")}
                      </Button>
                    </Link>
                  </div>
                )}
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Video Player Section */}
                <Card
                  className="overflow-hidden border-border/50 shadow-lg"
                  style={{
                    filter: blur ? "blur(10px)" : "none",
                  }}
                >
                  <div className="relative bg-black">
                    {lesson.videos?.[0] ? (
                      <VideoPlayer lesson={lesson} />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-linear-to-br from-muted/50 to-muted">
                        <div className="text-center">
                          <VideoOffIcon className="mx-auto h-16 w-16 text-muted-foreground/50" />
                          <p className="mt-4 text-sm text-muted-foreground">
                            No video available for this lesson
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Lesson Info and Content */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        {lesson?.title}
                      </h1>
                    </div>
                    {lesson.videos?.[0] &&
                      isPreviousLessonCompleted?.completed &&
                      isPreviousSectionCompleted?.completed && (
                        <CompleteButton
                          enrollmentId={course?.enrollments?.[0]?.id!}
                          isVideoCompleted={
                            isVideoCompleted?.completed || false
                          }
                          lessonId={lessonId}
                          videoId={lesson?.videos?.[0]?.id!}
                        />
                      )}
                  </div>

                  {/* Tabs for Content Organization */}
                  <Tabs className="w-full" defaultValue="overview">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger className="gap-2" value="overview">
                        <BookOpen className="h-4 w-4" />
                        {t("common.overview")}
                      </TabsTrigger>
                      <TabsTrigger
                        className="gap-2"
                        disabled={lessonResources.length === 0}
                        value="resources"
                      >
                        <FileIcon className="h-4 w-4" />
                        {t("common.resources")}
                        {lessonResources.length > 0 && (
                          <Badge
                            className="ml-1 h-5 min-w-5 rounded-full px-1 text-xs"
                            variant="secondary"
                          >
                            {lessonResources.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent className="mt-6" value="overview">
                      <Card className="border-border/50">
                        <CardContent className="p-6">
                          {(lesson.description || "").trim().length !== 0 ? (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: purify.sanitize(
                                  lexicalToHtml(JSON.parse(lesson.description))
                                ),
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                              <p className="mt-4 text-sm text-muted-foreground">
                                {t("common.noDescriptionAvailable")}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Resources Tab */}
                    <TabsContent className="mt-6" value="resources">
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileIcon className="h-5 w-5" />
                            {t("common.resources")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {lessonResourcesLoading ? (
                            <div className="flex h-32 items-center justify-center">
                              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : lessonResourcesError ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <p className="text-sm text-destructive">
                                {t("common.somethingWentWrong")}
                              </p>
                            </div>
                          ) : lessonResources.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {lessonResources.map((resource) => (
                                <Card
                                  className="group transition-all hover:border-primary/50 hover:shadow-md"
                                  key={resource.id}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10">
                                        <FileIcon className="h-5 w-5 text-primary" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="truncate font-semibold text-sm">
                                          {resource.title || resource.fileName}
                                        </h4>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                          {resource.fileName}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {(
                                            resource.fileSize /
                                            1024 /
                                            1024
                                          ).toFixed(2)}{" "}
                                          MB
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      className="mt-3 w-full"
                                      onClick={() =>
                                        handleDownloadResource(resource.id)
                                      }
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      {t("common.download", {
                                        default: "Download",
                                      })}
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <FileIcon className="h-12 w-12 text-muted-foreground/50" />
                              <p className="mt-4 text-sm text-muted-foreground">
                                No resources available for this lesson
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <MobileSidebar course={course} lessonId={lessonId} />
    </Sheet>
  );
}
