"use client";

import {
  IconArrowLeft,
  IconLoader,
  IconTrash,
  IconVideo,
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  findCourseSection,
  findLesson,
  getCourse,
  updateCourseSection,
  updateLesson,
} from "@/lib/courses";
import { attempt } from "@/lib/utils";
import { DescriptionForm } from "./_components/description-form";
import { LessonTabs } from "./_components/lesson-tabs";
import { TitleForm } from "./_components/title-form";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");

  const t = useTranslations("lessons");
  const tCommon = useTranslations("common");
  const tCourses = useTranslations("courses");

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ["course", params.courseId],
    queryFn: async () => {
      const [response, error] = await attempt(
        getCourse(Number(params.courseId))
      );
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      return response;
    },
  });

  const { data: section, isLoading: isSectionLoading } = useQuery({
    queryKey: ["section", params.sectionId],
    queryFn: async () => {
      const [response, error] = await attempt(
        findCourseSection(Number(params.courseId), Number(params.sectionId))
      );
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      return response;
    },
  });

  const { data: lessonData, isLoading: isLessonLoading } = useQuery({
    queryKey: ["lesson", params.lessonId],
    queryFn: async () => {
      const [response, error] = await attempt(
        findLesson(
          Number(params.courseId),
          Number(params.sectionId),
          Number(params.lessonId)
        )
      );

      if (error) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }

      return response;
    },
  });

  useEffect(() => {
    if (lessonData?.data) {
      setTitle(lessonData.data.title);
    }
  }, [lessonData?.data]);

  async function handleUpdateTitle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(tCommon("cannotBeEmpty"));
      return;
    }

    setIsLoading(true);
    const [, error] = await attempt(
      updateLesson(
        Number(params.courseId),
        Number(params.sectionId),
        Number(params.lessonId),
        { title }
      )
    );

    if (error) {
      toast.error(tCommon("somethingWentWrong"));
    } else {
      toast.success(tCommon("updatedSuccessfully"));
      queryClient.invalidateQueries({
        queryKey: ["section", params.sectionId],
      });
    }
    setIsLoading(false);
  }

  async function handleDeleteLesson() {
    setIsLoading(true);
    const [, error] = await attempt(
      updateCourseSection(Number(params.courseId), Number(params.sectionId), {
        title: `${section?.data?.title} (Deleted)`,
      })
    );

    if (error) {
      toast.error(tCommon("somethingWentWrong"));
    } else {
      toast.success(tCommon("deletedSuccessfully"));
      router.push(
        `/dashboard/courses/${params.courseId}/sections/${params.sectionId}`
      );
    }
    setIsLoading(false);
  }

  if (
    !course?.data ||
    !section?.data ||
    !lessonData?.data ||
    isLessonLoading ||
    isCourseLoading ||
    isSectionLoading
  ) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const lesson = lessonData.data;

  return (
    <div className="container mx-auto space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/courses">
              {tCourses("title")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/courses/${course.data.id}`}>
              {course.data.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/courses/${course.data.id}/sections/${params.sectionId}`}
            >
              {section.data.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {tCommon("edit")} {t("lesson")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="items-center justify-between md:flex">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/courses/${params.courseId}/sections/${params.sectionId}`}
          >
            <Button size="icon" variant="ghost">
              <IconArrowLeft className="rotate-rtl h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {tCommon("edit")} {t("lesson")}
            </h1>
            <p className="text-muted-foreground">
              Course: {course.data.title} - Section: {section.data.title}
            </p>
          </div>
        </div>
        <AlertDialog>
          <div className="flex w-full justify-end">
            <AlertDialogTrigger asChild>
              <Button className="mt-2 md:mt-0" variant="destructive">
                <IconTrash className="mr-2 h-4 w-4" />
                {tCommon("delete")} {t("lesson")}
              </Button>
            </AlertDialogTrigger>
          </div>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tCommon("areYouSure")}?</AlertDialogTitle>
              <AlertDialogDescription>
                {tCommon("deleteDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={handleDeleteLesson}
              >
                {tCommon("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Separator />

      <div className="flex flex-col-reverse gap-6 lg:flex-row">
        <div className="w-full space-y-6 lg:w-1/2">
          <TitleForm
            courseId={Number(params.courseId)}
            initialData={{ title: lesson.title }}
            lessonId={Number(params.lessonId)}
            sectionId={Number(params.sectionId)}
          />

          <DescriptionForm
            courseId={Number(params.courseId)}
            initialData={JSON.parse(lesson.description)}
            lessonId={Number(params.lessonId)}
            sectionId={Number(params.sectionId)}
          />
        </div>

        <div className="grid w-full gap-6 lg:w-1/2">
          <Card className="shadow-none">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <IconVideo className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {t("lessonContent")}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t("addVideosAndQuizzesToYourLesson")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <LessonTabs  lesson={lesson} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
