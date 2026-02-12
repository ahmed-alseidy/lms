"use client";

import {
  IconArrowLeft,
  IconLoader,
  IconLoader2,
  IconPlus,
  IconTrash,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CourseSection,
  createLesson,
  findCourseSection,
  getCourse,
  updateCourseSection,
} from "@/lib/courses";
import { attempt } from "@/lib/utils";
import { LessonsList } from "./_components/lesson-list";
export default function SectionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [sectionData, setSectionData] = useState<CourseSection | null>(null);
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const tLessons = useTranslations("lessons");

  const { data: course } = useQuery({
    queryKey: ["course", params.courseId],
    queryFn: async () => {
      const [data, error] = await attempt(getCourse(Number(params.courseId)));
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      return data;
    },
  });

  const { data: section } = useQuery({
    queryKey: ["section", params.sectionId],
    queryFn: async () => {
      const [data, error] = await attempt(
        findCourseSection(Number(params.courseId), Number(params.sectionId))
      );
      if (error) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      return data;
    },
  });

  useEffect(() => {
    if (section?.data) {
      setTitle(section.data.title);
      setSectionData({
        ...section.data,
        lessons: (section.data.lessons || []).map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          videos: lesson.videos,
          quizzes: lesson.quizzes,
          description: lesson.description,
        })),
      });
    }
  }, [section?.data]);

  async function handleUpdateTitle() {
    if (!title.trim()) {
      toast.error(tCommon("cannotBeEmpty"));
      return;
    }

    setIsLoading(true);
    const [, error] = await attempt(
      updateCourseSection(Number(params.courseId), Number(params.sectionId), {
        title,
      })
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

  async function handleDeleteSection() {
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
      router.push(`/dashboard/courses/${params.courseId}`);
    }
    setIsLoading(false);
  }

  async function addLesson() {
    if (!sectionData) return;
    const lessons = [...sectionData.lessons];

    const [lessonQuery, error] = await attempt(
      createLesson(course?.data?.id!, section?.data?.id!, {
        title: `Lesson ${lessons.length + 1}`,
        orderIndex: lessons.length,
      })
    );
    if (error) {
      toast.error(tCommon("somethingWentWrong"));
      return;
    }

    lessons.push({
      id: lessonQuery.data.id,
      title: `Lesson ${lessons.length + 1}`,
      orderIndex: lessons.length,
      videos: [],
      quizzes: [],
      description: "",
    });

    setSectionData({
      ...sectionData,
      lessons,
    });
  }

  if (!course?.data || !section?.data) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <IconLoader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/courses">
              {t("title")}
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
            <BreadcrumbPage>{section.data.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/courses/${params.courseId}`}>
            <Button size="icon" variant="ghost">
              <IconArrowLeft className="rotate-rtl h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{section.data.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {course.data.title}
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              size="icon"
              variant="ghost"
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
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
                onClick={handleDeleteSection}
              >
                {tCommon("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tCommon("details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{tCommon("title")}</Label>
              <Input
                id="title"
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tCommon("titlePlaceholder")}
                value={title}
              />
              <Button
                className="w-full"
                disabled={isLoading}
                onClick={handleUpdateTitle}
              >
                {isLoading ? (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {tCommon("save")}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {tLessons("title")}
                </span>
                <span className="font-medium">
                  {sectionData?.lessons?.length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{tCommon("content")}</CardTitle>
              <Button onClick={addLesson} size="sm">
                <IconPlus className="mr-2 h-4 w-4" />
                {tLessons("createLesson")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <LessonsList
              course={course}
              sectionData={sectionData!}
              setIsLoading={setIsLoading}
              setSectionData={setSectionData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
