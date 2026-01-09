"use client";

import {
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconLayoutDashboard,
  IconList,
  IconLoader,
  IconLoader2,
  IconQrcode,
  IconSettings2,
  IconTrash,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { deleteCourse, updateCourse } from "@/lib/courses";
import { attempt, cn } from "@/lib/utils";
import { ChaptersList } from "./chapters-list";
import { DescriptionForm } from "./description-form";
import { ImageForm } from "./image-form";
import { PriceForm } from "./price-form";
import { TitleForm } from "./title-form";

export default function CourseEdit({ course }: { course: any }) {
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const [publishLoading, setPublishLoading] = useState(false);
  const queryClient = useQueryClient();

  async function onClickPublish() {
    if (course.published) {
      setPublishLoading(false);
      const [, error] = await attempt(
        updateCourse(course.id, { published: false })
      );
      if (error) toast("Cannot unpublish course");
    } else {
      setPublishLoading(true);
      const [, error] = await attempt(
        updateCourse(course.id, { published: true })
      );
      if (error) toast("Cannot publish course");
    }
    queryClient.invalidateQueries({
      queryKey: ["dashboard-course", course.id],
    });
    setPublishLoading(false);
  }

  async function onClickDelete() {
    setPublishLoading(true);
    const [, error] = await attempt(deleteCourse(course.id));
    if (error) toast("Cannot delete course");
    setPublishLoading(false);
    router.replace("/dashboard/courses");
  }

  return (
    <div className="mx-auto mt-4 space-y-4">
      <div className="items-center justify-between md:flex">
        <div className="flex items-center gap-2 space-y-1">
          <Link
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            href={`/dashboard/courses/${course.id}/analytics`}
          >
            <IconArrowLeft className="rotate-rtl h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("courseSettings")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("courseSettingsDescription")}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 md:mt-0 justify-end">
          <Button
            className="gap-2"
            disabled={publishLoading}
            onClick={onClickPublish}
            variant={course.published ? "outline" : "default"}
          >
            {publishLoading ? (
              <IconLoader className="h-4 w-4 animate-spin" />
            ) : course.published ? (
              <>
                <IconEyeOff className="h-4 w-4" />
                <span>{t("unpublish")}</span>
              </>
            ) : (
              <>
                <IconEye className="h-4 w-4" />
                <span>{t("unpublish")}</span>
              </>
            )}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                disabled={publishLoading}
                variant="destructive"
              >
                <IconTrash className="h-4 w-4" />
                {tCommon("delete")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {tCommon("delete")} {t("course")}
                </DialogTitle>
                <DialogDescription>
                  {tCommon("deleteDescription")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  className="gap-2"
                  disabled={publishLoading}
                  onClick={onClickDelete}
                  variant="destructive"
                >
                  {publishLoading && (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  )}
                  {tCommon("delete")} {t("course")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="flex-row justify-start">
            <div className="flex gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <IconLayoutDashboard className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{t("courseDetails")}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t("courseDetailsDescription")}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <TitleForm
                courseId={course.id}
                initialData={{ title: course.title }}
              />
              <DescriptionForm
                courseId={course.id}
                initialData={{ description: course.description }}
              />
              <PriceForm
                courseId={course.id}
                initialData={{ price: course.price }}
              />
              <ImageForm courseId={course.id} initialData={course} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <IconQrcode className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{t("courseCodes")}</h2>
                  <p className="text-muted-foreground text-sm">
                    {t("courseCodesDescription")}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 flex w-full items-center justify-between rounded-lg border p-4">
              <p className="text-sm">
                {course.courseCodes?.length || 0} {t("courseCodesGenerated")}
              </p>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/dashboard/courses/${course.id}/codes`}
              >
                <IconSettings2 className="mr-1 h-4 w-4" />
                {t("courseCodesGenerate")}
              </Link>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <IconList className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {t("courseContent")}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {t("courseContentDescription")}
                    </p>
                  </div>
                </div>
              </div>
              <Badge className="font-medium" variant="secondary">
                {course.courseSections?.length || 0} {t("chapters")}
              </Badge>
            </div>
            <ChaptersList course={course} />
          </div>
        </div>
      </div>
    </div>
  );
}
