"use client";

import { IconArrowLeft, IconFileText, IconLoader } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCourse } from "@/lib/courses";
import { getQuizSubmissions, type QuizSubmissionListItem } from "@/lib/quizzes";
import { attempt } from "@/lib/utils";

const statusKey = (
  status: QuizSubmissionListItem["status"]
): "statusPending" | "statusGraded" | "statusAutoGraded" => {
  switch (status) {
    case "pending":
      return "statusPending";
    case "graded":
      return "statusGraded";
    case "auto_graded":
      return "statusAutoGraded";
    default:
      return "statusPending";
  }
};

const formatDate = (dateStr: string | null, locale: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function QuizSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("quizzes");
  const lessonId = Number(params.lessonId);
  const quizId = params.quizId as string;
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const locale = useLocale();

  const { data: course } = useQuery({
    queryKey: ["course", params.courseId],
    queryFn: async () => {
      const [res, err] = await attempt(getCourse(Number(params.courseId)));
      if (err) {
        toast.error("Failed to load course");
        return null;
      }
      return res?.data;
    },
  });

  const {
    data: submissionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["quiz-submissions", quizId, page, pageSize],
    queryFn: async () => {
      const [res, err] = await attempt(
        getQuizSubmissions(lessonId, quizId, page, pageSize)
      );
      console.log(res);
      if (err) {
        toast.error(t("failedToLoadSubmissions"));
        throw err;
      }
      return res?.data;
    },
    // Keep previous page's data while loading the next page for smoother UX
    placeholderData: (prev) => prev,
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !submissionsData) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("failedToLoadSubmissions")}</p>
        <Button onClick={() => router.back()} variant="outline">
          <IconArrowLeft className="rotate-rtl h-4 w-4" />
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const { quiz, submissions } = submissionsData;
  const quizEditUrl = `/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${params.lessonId}/quizzes/${quizId}`;

  const totalPages = Math.max(1, submissionsData.pagination.totalPages);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/courses">
              {t("courses")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/courses/${params.courseId}`}>
              {course?.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={quizEditUrl}>{quiz.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("submissionsTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            className="h-8 w-8"
            onClick={() => router.back()}
            size="icon"
            variant="ghost"
          >
            <IconArrowLeft className="rotate-rtl h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("submissionsTitle")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("submissionsDescription")}
            </p>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconFileText className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              {t("noSubmissionsYet")}
            </h3>
            <p className="text-muted-foreground text-center text-sm">
              {t("noSubmissionsDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {quiz.title} — {submissions.length} submission
              {submissions.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={`${locale === "ar" ? "text-right" : "text-left"}`}
                  >
                    {t("student") ?? "Student"}
                  </TableHead>
                  <TableHead
                    className={`${locale === "ar" ? "text-right" : "text-left"}`}
                  >
                    {t("submittedAt")}
                  </TableHead>
                  <TableHead
                    className={`${locale === "ar" ? "text-right" : "text-left"}`}
                  >
                    {t("attempt")}
                  </TableHead>
                  <TableHead
                    className={`${locale === "ar" ? "text-right" : "text-left"}`}
                  >
                    {t("score")}
                  </TableHead>
                  <TableHead
                    className={`${locale === "ar" ? "text-right" : "text-left"}`}
                  >
                    {t("status") ?? "Status"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("actions") ?? "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{sub.student.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {sub.student.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(sub.completedAt, locale)}</TableCell>
                    <TableCell>{sub.attempt}</TableCell>
                    <TableCell>
                      {sub.status === "graded" && sub.score != null
                        ? `${Math.round(Number(sub.score) * 100)}%`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${sub.status === "pending" ? "bg-yellow-400/5 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400" : ""}`}
                        variant={
                          sub.status === "pending" ? "outline" : "default"
                        }
                      >
                        {t(statusKey(sub.status))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${params.lessonId}/quizzes/${quizId}/submissions/${sub.id}`}
                        >
                          {t("viewSubmission")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {`Showing ${startIndex + 1}–${Math.min(
                    startIndex + pageSize,
                    submissions.length
                  )} of ${submissions.length}`}
                </span>
              </TableCaption>
            </Table>

            {totalPages > 1 && (
              <Pagination
                className="mt-4"
                dir={locale === "ar" ? "rtl" : "ltr"}
              >
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      aria-disabled={currentPage === 1}
                      href="#"
                      noText
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((prev) => Math.max(1, prev - 1));
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === index + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(index + 1);
                        }}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      aria-disabled={currentPage === totalPages}
                      href="#"
                      noText
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((prev) => Math.min(totalPages, prev + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
