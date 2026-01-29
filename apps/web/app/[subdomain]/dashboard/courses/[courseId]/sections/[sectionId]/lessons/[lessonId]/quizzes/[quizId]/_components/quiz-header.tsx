"use client";

import { IconArrowLeft, IconChartBar } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { QuestionDialog } from "./question-dialog";

interface QuizHeaderProps {
  courseTitle?: string;
  sectionTitle?: string;
  lessonTitle?: string;
  questionLength: number;
  quizId: string;
  setQuestions: React.Dispatch<React.SetStateAction<any[]>>;
}

export function QuizHeader({
  courseTitle,
  sectionTitle,
  lessonTitle,
  questionLength,
  quizId,
  setQuestions,
}: QuizHeaderProps) {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/courses">
              {t("navigation.courses")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/courses/${params.courseId}`}>
              {courseTitle}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/courses/${params.courseId}/sections/${params.sectionId}`}
            >
              {sectionTitle}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${params.lessonId}`}
            >
              {lessonTitle}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("quizzes.editQuizTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4 items-center justify-between md:flex">
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
            <h1 className="text-2xl font-bold">{t("quizzes.editQuizTitle")}</h1>
            <p className="text-muted-foreground">
              {t("quizzes.editQuizDescription")}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={() =>
              router.push(
                `/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${params.lessonId}/quizzes/${params.quizId}/analytics`
              )
            }
            variant="outline"
          >
            <IconChartBar className="mr-2 h-4 w-4" />
            {t("quizzes.analytics")}
          </Button>
          <QuestionDialog
            questionLength={questionLength}
            quizId={quizId}
            setQuestions={setQuestions}
          />
        </div>
      </div>
    </>
  );
}
