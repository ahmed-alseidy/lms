"use client";

import { SelectCourse } from "@lms-saas/shared-lib";
import { IconBook, IconPencil, IconStar, IconUsers } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function CourseCard({
  course,
}: {
  course: SelectCourse & { studentsCount: number };
}) {
  const t = useTranslations("courses");

  return (
    <Card className="group hover:border-primary/50 flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg">
      <CardHeader className="relative p-0">
        <Image
          alt={course.title}
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          height={192}
          src={course.imageUrl || "https://picsum.photos/300/192"}
          width={300}
        />
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
            {course.description || t("noDescriptionAvailable")}
          </p>
        </div>

        <div className="text-muted-foreground mt-auto flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <IconUsers className="h-4 w-4" />
            <span>
              {course.studentsCount} {t("students")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <IconBook className="h-4 w-4" />
            <span>
              {course.lessonsCount} {t("lessons")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <IconStar className="h-4 w-4" />
            <span>0.0</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-accent/50 border-t p-4">
        <Link className="w-full" href={`/dashboard/courses/${course.id}`}>
          <Button
            className="w-full gap-2 text-sm transition-colors"
            variant="default"
          >
            <IconPencil className="h-4 w-4" />
            {t("editCourse")}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
