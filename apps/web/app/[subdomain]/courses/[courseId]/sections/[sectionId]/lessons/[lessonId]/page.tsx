"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import purify from "dompurify";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader,
  Menu,
  Play,
  Video,
  VideoOffIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { findLesson, getCourse } from "@/lib/courses";
import { lexicalToHtml } from "@/lib/lexical-to-html";
import { attempt, cn } from "@/lib/utils";
import { checkIfVideoCompleted, completeVideo } from "@/lib/videos";
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
  });

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

  const handleCompleteVideo = async () => {
    const enrollmentId = course?.enrollments?.[0]?.id;
    if (!enrollmentId) return;

    const [, error] = await attempt(
      completeVideo(lessonId, lesson?.videos?.[0]?.id!, enrollmentId)
    );

    if (error) {
      toast.error(t("common.somethingWentWrong"));
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ["video-completed", lessonId],
    });

    queryClient.invalidateQueries({
      queryKey: ["lesson-completed", lessonId],
    });

    toast.success(t("lessons.videoCompleted"));
  };

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

  if (courseLoading || lessonLoading || isVideoLoading || !course || !lesson) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Sheet>
      <div
        className="flex h-full min-h-screen w-full"
        onClick={() => setBlur(false)}
        style={{
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          userSelect: "none",
        }}
      >
        <aside className="border-border/70 bg-muted sticky top-0 hidden h-full w-96 border-r border-l p-2 lg:block">
          <div className="flex items-center gap-2 p-2">
            {course.imageUrl ? (
              <Image
                alt={course.title}
                className="rounded-lg"
                height={50}
                src={course.imageUrl}
                width={50}
              />
            ) : (
              <div className="bg-primary/10 flex h-[50px] w-[50px] items-center justify-center rounded-lg">
                <Play className="text-primary h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="text-primary text-2xl font-semibold text-wrap">
                {course.title}
              </h2>
              <p className="text-muted-foreground line-clamp-1 text-sm">
                {course.description || t("courses.noDescriptionAvailable")}
              </p>
            </div>
          </div>
          <div className="space-y-2 p-2">
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <p>{t("courses.yourProgress")}</p>
              <div className="flex items-center gap-2">
                {course.enrollments?.[0]?.studentLessonCompletions.length}/
                {course.lessonsCount} {t("courses.lessons")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex w-full flex-col gap-2">
                <Progress value={course.enrollments?.[0]?.progress || 0} />
                <p className="text-muted-foreground text-sm">
                  {course.enrollments?.[0]?.progress.toFixed(2) || "0.00"}%{" "}
                  {t("courses.complete")}
                </p>
              </div>
            </div>
          </div>
          <Separator className="my-2" />
          <SidebarContent course={course} lessonId={lessonId} />
        </aside>

        <div className="flex w-full flex-1 flex-col items-center p-4 md:flex-1">
          <div className="mb-2 flex w-full max-w-6xl items-center gap-2">
            <div className="lg:hidden">
              <SheetTrigger
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <Menu size={24} />
                <span>{t("courses.courseContent")}</span>
              </SheetTrigger>
            </div>
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href={`/courses`}
            >
              <ArrowLeft className="rotate-rtl h-4 w-4" />
              <span>{t("courses.backToCourses")}</span>
            </Link>
          </div>

          <div
            className="bg-muted relative mb-8 w-full max-w-6xl overflow-hidden rounded-lg border min-h-[240px]"
            style={{
              filter: blur ? "blur(10px)" : "none",
            }}
          >
            {lesson.videos?.[0] ? (
              <VideoPlayer lesson={lesson} />
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <VideoOffIcon className="text-muted-foreground h-24 w-24" />
              </div>
            )}
          </div>
          <div className="border-border mb-8 w-full max-w-6xl rounded-lg border p-4">
            <h1 className="text-3xl font-bold">{lesson?.title}</h1>
            {(lesson.description || "").trim().length !== 0 && (
              <>
                <Separator className="my-4" />
                <p
                  className="text-lg text-balance break-all whitespace-normal"
                  dangerouslySetInnerHTML={{
                    __html: purify.sanitize(
                      lexicalToHtml(JSON.parse(lesson.description))
                    ),
                  }}
                />
              </>
            )}
          </div>

          <div className="flex w-full max-w-6xl justify-end gap-4">
            {lesson.videos?.[0] && (
              <Button
                disabled={isVideoCompleted?.completed}
                onClick={handleCompleteVideo}
              >
                {isVideoCompleted?.completed ? (
                  <CheckCircle className="text-primary-foreground h-3 w-3" />
                ) : (
                  <Video className="h-3 w-3" />
                )}
                {isVideoCompleted?.completed
                  ? t("lessons.completed")
                  : t("lessons.markCompleted")}
              </Button>
            )}
            {nav.prev && (
              <Link
                className={cn(
                  "hover:bg-muted inline-flex items-center gap-2 rounded border px-4 py-2",
                  buttonVariants({ variant: "outline" })
                )}
                href={`/courses/${courseId}/sections/${nav.prev.sectionId}/lessons/${nav.prev.lessonId}`}
              >
                <ArrowLeft className="rotate-rtl" />
              </Link>
            )}
            {nav.next && (
              <Link
                className={cn(
                  "hover:bg-muted inline-flex items-center gap-2 rounded border px-4 py-2",
                  buttonVariants({ variant: "outline" })
                )}
                href={`/courses/${courseId}/sections/${nav.next.sectionId}/lessons/${nav.next.lessonId}`}
              >
                <ArrowRight className="rotate-rtl" />
              </Link>
            )}
          </div>
        </div>
      </div>
      <MobileSidebar course={course} lessonId={lessonId} />
    </Sheet>
  );
}
