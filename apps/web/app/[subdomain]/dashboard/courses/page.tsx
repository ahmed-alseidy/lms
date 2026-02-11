"use client";

import { IconLoader, IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { CourseWithEnrollments, getCoursesByTeacherId } from "@/lib/courses";
import { attempt } from "@/lib/utils";
import { CourseCard } from "./course-card";
import { CreateCourseForm } from "./create-course-form";

export default function CoursesPage() {
  const t = useTranslations("courses");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [published, setPublished] = useState(true);
  const { data, isLoading } = useQuery<{
    courses: CourseWithEnrollments[];
    count: number;
  }>({
    queryKey: ["dashboard-courses", page, published],
    queryFn: async () => {
      const [response, error] = await attempt(
        getCoursesByTeacherId(published, page, 8, false)
      );
      if (error) {
        toast.error("Error fetching courses");
        return { courses: [], count: 0 };
      }
      return response ?? { courses: [], count: 0 };
    },
  });

  if (isLoading)
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );

  const courses = data?.courses ?? [];
  const count = data?.count ?? 0;

  const totalPages = Math.ceil(count / 8);
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <div className="container mt-2">
        <div className="flex w-full flex-col justify-between md:flex-row">
          <h2 className="text-3xl font-bold">{t("title")}</h2>
          <DialogTrigger asChild className="place-self-end">
            <Button className="mt-2 md:mt-0">
              <IconPlus />
              {t("createCourse")}
            </Button>
          </DialogTrigger>
        </div>

        <div>
          <div className="mt-4 mb-2">
            <Button
              className={published ? "underline" : ""}
              onClick={() => {
                setPublished(true);
                setPage(1);
              }}
              variant={"link"}
            >
              {t("published")}
            </Button>
            <Button
              className={!published ? "underline" : ""}
              onClick={() => {
                setPublished(false);
                setPage(1);
              }}
              variant={"link"}
            >
              {t("unpublished")}
            </Button>
          </div>

          <Separator />

          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
            {courses.length === 0 ? (
              <div className="text-muted-foreground col-span-full text-center">
                {t("noCourses")}
              </div>
            ) : (
              courses.map((course: CourseWithEnrollments) => (
                <CourseCard course={course} key={course.id} />
              ))
            )}
          </div>
        </div>
      </div>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem className={page === 1 ? "hidden" : ""}>
            <PaginationPrevious
              aria-disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              size={"sm"}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                isActive={i + 1 === page}
                onClick={() => handlePageChange(i + 1)}
                size={"icon"}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          {totalPages > 5 && <PaginationEllipsis />}

          <PaginationItem
            className={page === totalPages || totalPages === 0 ? "hidden" : ""}
          >
            <PaginationNext
              aria-disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              size={"sm"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createCourse")}</DialogTitle>
        </DialogHeader>
        <CreateCourseForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}
