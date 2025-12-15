import { useAtom } from "jotai";
import { Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { localeAtom } from "@/lib/atoms";
import { CourseWithSectionsAndEnrollments } from "@/lib/courses";
import { SidebarContent } from "./sidebar-content";

export function MobileSidebar({
  course,
  lessonId,
}: {
  course: CourseWithSectionsAndEnrollments;
  lessonId: number;
}) {
  const [locale] = useAtom(localeAtom);
  const t = useTranslations();

  return (
    <SheetContent side={locale === "ar" ? "right" : "left"}>
      <SheetHeader>
        <SheetTitle>{""}</SheetTitle>
      </SheetHeader>
      <div className="overflow-y-auto px-4">
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
            <p className="text-muted-foreground text-sm">
              {course.description || t("courses.noDescriptionAvailable")}
            </p>
          </div>
        </div>
        <div className="space-y-2 p-2">
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <p>{t("courses.yourProgress")}</p>
            <div className="flex items-center gap-2">
              {course.enrollments?.[0]?.studentLessonCompletions.length}/
              {course.courseSections?.[0]?.lessons?.length}{" "}
              {t("courses.lessons")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex w-full flex-col gap-2">
              <Progress value={course.enrollments?.[0]?.progress || 0} />
              <p className="text-muted-foreground text-sm">
                {course.enrollments?.[0]?.progress || 0}%{" "}
                {t("courses.complete")}
              </p>
            </div>
          </div>
        </div>
        <Separator className="my-2" />
        <SidebarContent course={course} lessonId={lessonId} />
      </div>
    </SheetContent>
  );
}
