"use client";

import { BookOpen, Clock, Star, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { CourseWithEnrollments } from "@/lib/courses";

export function CourseCard({ course }: { course: CourseWithEnrollments }) {
  const router = useRouter();
  const t = useTranslations();

  return (
    <Card className="hover:border-primary/50 overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg">
      <CardHeader className="border-border relative border-b p-0">
        <div className="relative mb-0 aspect-video h-full">
          {course.imageUrl ? (
            <Image
              alt={course.title}
              className="h-full w-full object-cover"
              height={192}
              src={course.imageUrl}
              width={300}
            />
          ) : (
            <div className="bg-muted flex h-full items-center justify-center">
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

      <CardContent className="flex flex-1 flex-col gap-3 p-4 py-0">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-lg font-semibold">{course.title}</h3>
          <p className="text-muted-foreground line-clamp-1 text-sm">
            {course.description || t("courses.noDescriptionAvailable")}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course.studentsCount}
            <span>{t("courses.students")}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.lessonsCount}
            <span>{t("courses.lessons")}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* TODO: Add rating */}
            <Star className="h-4 w-4" />
            <span>{t("courses.rating")}</span>
          </div>
        </div>

        {course.myEnrollment?.[0] ? (
          <div>
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
              <span>{t("courses.progress")}</span>
              <span>{course.myEnrollment[0].progress}%</span>
            </div>
            <div className="bg-secondary h-2 w-full rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${course.myEnrollment[0].progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <Button
              className="w-full gap-2 text-sm transition-colors"
              onClick={() => router.push(`/courses/${course.id}/enroll`)}
              variant="outline"
            >
              <BookOpen className="h-4 w-4" />
              {t("courses.enrollNow")}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t p-4">
        <Button
          className="w-full gap-2 text-sm transition-colors"
          onClick={() => router.push(`/courses/${course.id}`)}
          variant="default"
        >
          <BookOpen className="h-4 w-4" />
          {t("courses.courseDetails")}
        </Button>
      </CardFooter>
    </Card>
  );
}
