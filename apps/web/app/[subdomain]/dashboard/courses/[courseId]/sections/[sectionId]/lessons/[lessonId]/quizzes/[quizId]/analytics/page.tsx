"use client";

import {
  IconArrowLeft,
  IconChartBar,
  IconClock,
  IconLoader,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { Progress } from "@/components/ui/progress";
import { authFetch } from "@/lib/auth-fetch";
import { BACKEND_URL } from "@/lib/constants";
import { getCourse } from "@/lib/courses";
import { attempt } from "@/lib/utils";

interface QuizAnalytics {
  quiz: {
    id: string;
    title: string;
    duration: number;
  };
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
  attemptsPerStudent: Array<{
    studentId: number;
    attempts: number;
  }>;
  questionDifficulty: Array<{
    questionId: number;
    questionText: string;
    orderIndex: number;
    correctPercentage: number;
    totalAnswers: number;
    correctAnswers: number;
  }>;
  averageTimeSpent: number;
  timeSpentDistribution: {
    min: number;
    max: number;
    median: number;
  };
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function QuizAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();

  const { data: course } = useQuery({
    queryKey: ["course", params.courseId],
    queryFn: async () => {
      const [response, error] = await attempt(
        getCourse(Number(params.courseId))
      );
      if (error) {
        toast.error("Failed to fetch course");
        return null;
      }
      return response?.data;
    },
  });

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["quiz-analytics", params.quizId],
    queryFn: async () => {
      const [response, error] = await attempt(
        authFetch<QuizAnalytics>(
          `${BACKEND_URL}/lessons/${params.lessonId}/quizzes/${params.quizId}/analytics`,
          {
            method: "GET",
          }
        )
      );
      if (error) {
        toast.error("Failed to fetch quiz analytics");
        throw error;
      }
      return response?.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <IconLoader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Failed to load analytics</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
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
              {course?.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("quizzes.analytics")}</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold">{analytics.quiz.title}</h1>
            <p className="text-muted-foreground">Quiz Analytics Dashboard</p>
          </div>
        </div>
      </div>

      {analytics.totalSubmissions === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconChartBar className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No Submissions Yet</h3>
            <p className="text-muted-foreground text-center">
              Analytics will appear here once students start taking this quiz.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Submissions
                </CardTitle>
                <IconUsers className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalSubmissions}
                </div>
                <p className="text-muted-foreground text-xs">
                  {analytics.attemptsPerStudent.length} unique students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Score
                </CardTitle>
                <IconTrendingUp className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(analytics.averageScore * 100)}%
                </div>
                <Progress
                  className="mt-2"
                  value={analytics.averageScore * 100}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
                <IconChartBar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(analytics.completionRate)}%
                </div>
                <p className="text-muted-foreground text-xs">
                  Students who completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Time Spent
                </CardTitle>
                <IconClock className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(analytics.averageTimeSpent)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Out of {analytics.quiz.duration} minutes allowed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Question Difficulty Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Question Difficulty Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.questionDifficulty.map((question, index) => (
                  <div className="space-y-2" key={question.questionId}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          Question {question.orderIndex + 1}:{" "}
                          {question.questionText}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {question.correctAnswers} / {question.totalAnswers}{" "}
                          correct answers
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {Math.round(question.correctPercentage)}%
                        </p>
                        <p className="text-muted-foreground text-xs">
                          correct rate
                        </p>
                      </div>
                    </div>
                    <Progress value={question.correctPercentage} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Time Spent Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-sm">Minimum</p>
                  <p className="text-2xl font-bold">
                    {formatTime(analytics.timeSpentDistribution.min)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Median</p>
                  <p className="text-2xl font-bold">
                    {formatTime(analytics.timeSpentDistribution.median)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Maximum</p>
                  <p className="text-2xl font-bold">
                    {formatTime(analytics.timeSpentDistribution.max)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attempts Per Student */}
          {analytics.attemptsPerStudent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attempts Per Student</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.attemptsPerStudent.map((item) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={item.studentId}
                    >
                      <span className="text-sm">
                        Student ID: {item.studentId}
                      </span>
                      <span className="font-medium">
                        {item.attempts} attempts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
