"use client";

import { classValidatorResolver } from "@hookform/resolvers/class-validator";
import { ValidateCodeDto } from "@lms-saas/shared-lib/dtos";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Loader, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { validateCourseCode } from "@/lib/course-codes";
import { getCourse } from "@/lib/courses";
import { attempt, cn } from "@/lib/utils";
export default function CourseEnrollPage() {
  const params = useParams();
  const t = useTranslations();
  const courseId = Number(params.courseId);

  const { data: courseResponse, isLoading } = useQuery({
    queryKey: ["student-course", courseId],
    queryFn: async () => {
      const [response, error] = await attempt(getCourse(courseId, true, true));
      if (error) {
        toast.error("Error fetching course");
        return;
      }
      return response;
    },
  });

  const course = courseResponse?.data;

  if (isLoading || !course) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Dialog>
      <div className="container mx-auto flex flex-col justify-between gap-8 px-4 py-8 md:flex-row md:items-start">
        <div className="flex-1">
          <h1 className="mb-2 text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground mb-6 max-w-xl">
            {course.description || t("courses.noDescriptionAvailable")}
          </p>
          <div className="overflow-hidden rounded-md">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <BookOpen className="text-primary h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold">
                      {t("courses.courseContent")}
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {course.courseSections?.length || 0} {t("courses.chapters")}{" "}
                    •{" "}
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
                  <Card className="overflow-hidden" key={section.id}>
                    <CardHeader className="bg-muted/50 p-4">
                      <h3 className="font-semibold">{section.title}</h3>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {section.lessons?.map((lesson) => (
                          <div
                            className="hover:bg-muted/50 flex items-center justify-between p-4 transition-colors"
                            key={lesson.id}
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                                <BookOpen className="text-primary h-4 w-4" />
                              </div>
                              <span>{lesson.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[40%]">
          <Card className="hover:border-primary/50 w-full overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg">
            <CardHeader className="relative mb-0 p-0">
              <div className="relative aspect-video">
                {course.imageUrl ? (
                  <Image
                    alt={course.title}
                    className="h-96 w-full object-cover"
                    height={192}
                    src={course.imageUrl}
                    width={600}
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

            <CardContent className="flex flex-1 flex-col gap-3 p-4">
              <div className="space-y-1">
                <h3 className="text-primary line-clamp-1 text-lg font-semibold">
                  {course.title}
                </h3>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {course.description || t("courses.noDescriptionAvailable")}
                </p>
              </div>

              <div className="text-muted-foreground mt-auto flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {course.studentsCount} {t("courses.students")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {course.lessonsCount} {t("courses.lessons")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>0.0</span>
                </div>
              </div>

              {course.enrollments?.[0] && (
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center justify-between text-sm">
                    <span>{t("courses.progress")}</span>
                    <span>{course.enrollments[0].progress}%</span>
                  </div>
                  <div className="bg-secondary h-2 w-full rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${course.enrollments[0].progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/50 border-t p-4">
              {course.enrollments?.[0] ? (
                <Link
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full gap-2 text-sm transition-colors"
                  )}
                  href={`/courses/${courseId}`}
                >
                  <BookOpen className="h-4 w-4" />
                  {t("courses.courseDetails")}
                </Link>
              ) : (
                <DialogTrigger asChild>
                  <Button
                    className="w-full gap-2 text-sm transition-colors"
                    variant="default"
                  >
                    <BookOpen className="h-4 w-4" />
                    {t("courses.enrollNow")}
                  </Button>
                </DialogTrigger>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      <EnrollDialogContent courseId={courseId} />
    </Dialog>
  );
}

const EnrollDialogContent = ({ courseId }: { courseId: number }) => {
  const router = useRouter();
  const resolver = useMemo(() => classValidatorResolver(ValidateCodeDto), []);
  const t = useTranslations();
  const form = useForm<ValidateCodeDto>({
    resolver,
    defaultValues: {
      code: "",
    },
  });

  async function onSubmit(data: ValidateCodeDto) {
    const [response, error] = await attempt(
      validateCourseCode(courseId, data.code)
    );

    if (error) {
      toast.error("Invalid course code");
    } else {
      if (response.data?.message) {
        toast.success("Successfully enrolled in the course!");
        router.push(`/courses/${courseId}`);
      }
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("courses.enrollInCourse")}</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        {t("courses.pleaseEnterCourseCode")}
      </DialogDescription>
      <DialogFooter>
        <Form {...form}>
          <form
            className="w-full space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("courses.courseCode")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("courses.courseCodePlaceholder")}
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={form.formState.isSubmitting || !form.formState.isValid}
              type="submit"
            >
              {form.formState.isSubmitting
                ? t("courses.enrolling")
                : t("courses.enroll")}
            </Button>
          </form>
        </Form>
      </DialogFooter>
    </DialogContent>
  );
};
