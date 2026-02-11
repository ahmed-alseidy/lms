"use client";

import { IconArrowLeft, IconLoader } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Pencil,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getCourse } from "@/lib/courses";
import {
  getQuizSubmissionDetail,
  gradeQuizSubmission,
  type QuizSubmissionQuestionAnswer,
} from "@/lib/quizzes";
import { attempt, cn } from "@/lib/utils";

const formatDate = (dateStr: string | null, locale: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function QuestionAnswer({
  q,
  index,
}: {
  q: QuizSubmissionQuestionAnswer;
  index: number;
}) {
  const t = useTranslations("quizzes");
  const td = useTranslations("quizzes.submissionDetail");

  const getQuestionTypeBadge = () => {
    const typeMap = {
      essay: { label: t("essayAnswer"), variant: "secondary" as const },
      multiple_choice: {
        label: td("multipleChoice"),
        variant: "outline" as const,
      },
      true_false: { label: td("trueFalse"), variant: "outline" as const },
    };
    const config = typeMap[q.questionType as keyof typeof typeMap];
    return config ? (
      <Badge className="text-xs" variant={config.variant}>
        {config.label}
      </Badge>
    ) : null;
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("question")} {index + 1}
                </span>
                {getQuestionTypeBadge()}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/30 p-4">
          <p className="font-medium leading-relaxed">{q.questionText}</p>
        </div>

        <div>
          <Label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {td("studentAnswer")}
          </Label>
          {q.submittedAnswer == null ? (
            <Alert className="bg-destructive/5" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{td("noAnswerSubmitted")}</AlertDescription>
            </Alert>
          ) : q.submittedAnswer.type === "essay" ? (
            <div className="rounded-lg border bg-card p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {q.submittedAnswer.textAnswer ? (
                  q.submittedAnswer.textAnswer
                ) : (
                  <span className="italic text-muted-foreground">
                    ({td("noTextProvided")})
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-3">
              <p className="text-sm font-medium">
                {q.submittedAnswer.answerText}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuizSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("quizzes");
  const td = useTranslations("quizzes.submissionDetail");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const lessonId = Number(params.lessonId);
  const quizId = params.quizId as string;
  const submissionId = Number(params.submissionId);
  const [scoreInput, setScoreInput] = useState("");
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const locale = useLocale();

  const { data: course } = useQuery({
    queryKey: ["course", params.courseId],
    queryFn: async () => {
      const [res, err] = await attempt(getCourse(Number(params.courseId)));
      if (err) return null;
      return res?.data;
    },
  });

  const {
    data: submission,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["quiz-submission-detail", quizId, submissionId],
    queryFn: async () => {
      const [res, err] = await attempt(
        getQuizSubmissionDetail(lessonId, quizId, submissionId)
      );
      if (err) {
        toast.error(t("failedToLoadSubmission"));
        throw err;
      }
      return res?.data;
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async (score: number) => {
      const [res, err] = await attempt(
        gradeQuizSubmission(lessonId, quizId, submissionId, score)
      );
      if (err) throw err;
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-submission-detail", quizId, submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["quiz-submissions", quizId] });
      toast.success(t("gradeSaved"));
      setIsEditingGrade(false);
      setScoreInput("");
    },
    onError: () => {
      toast.error(t("failedToSubmitGrade"));
    },
  });

  const handleSubmitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(scoreInput);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      toast.error("Enter a score between 0 and 100");
      return;
    }
    gradeMutation.mutate(num / 100);
  };

  const handleEditGrade = () => {
    if (submission?.score != null) {
      setScoreInput(String(Math.round(Number(submission.score) * 100)));
    }
    setIsEditingGrade(true);
  };

  const handleCancelEdit = () => {
    setIsEditingGrade(false);
    setScoreInput("");
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="space-y-4 text-center">
          <IconLoader className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {td("loadingSubmissionDetails")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-6">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">
            {t("failedToLoadSubmission")}
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            {td("failedToLoadMessage")}
          </p>
        </div>
        <Button onClick={() => router.back()} size="lg" variant="outline">
          <IconArrowLeft className="mr-2 h-4 w-4 rotate-rtl" />
          {td("goBack")}
        </Button>
      </div>
    );
  }

  const submissionsUrl = `/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${params.lessonId}/quizzes/${quizId}/submissions`;
  const quizEditUrl = `/dashboard/courses/${params.courseId}/sections/${params.sectionId}/lessons/${params.lessonId}/quizzes/${quizId}`;

  const getStatusBadge = () => {
    if (submission.status === "graded") {
      return (
        <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {td("graded")}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" />
        {td("pendingReview")}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
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
            <BreadcrumbLink href={quizEditUrl}>
              {submission.quiz.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={submissionsUrl}>
              {t("submissionsTitle")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">
              {submission.student.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <Button
          className="h-10 w-10 shrink-0"
          onClick={() => router.back()}
          size="icon"
          variant="ghost"
        >
          <IconArrowLeft className="h-5 w-5 rotate-rtl" />
        </Button>

        <Card className="flex-1 border-border/50 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* Student Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-semibold text-primary">
                    {getInitials(submission.student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      {submission.student.name}
                    </h1>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {submission.student.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {t("submittedAt")}:{" "}
                        {formatDate(submission.completedAt, locale)}
                      </span>
                    </div>
                    <Separator className="h-4" orientation="vertical" />
                    <Badge className="gap-1" variant="outline">
                      {t("attempt")} {submission.attempt}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="flex flex-col items-end gap-3">
                {getStatusBadge()}
                {submission.status === "graded" && submission.score != null && (
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      <span className="text-3xl font-bold">
                        {Math.round(Number(submission.score) * 100)}
                      </span>
                      <span className="text-lg font-medium text-muted-foreground">
                        / 100
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {td("finalScore")}
                    </p>
                  </div>
                )}
                {submission.autoScore != null &&
                  submission.status === "pending" && (
                    <Alert className="border-blue-500/20 bg-blue-500/5">
                      <AlertDescription className="text-xs">
                        <span className="font-semibold">
                          {td("autoScore")}:
                        </span>{" "}
                        {Math.round(Number(submission.autoScore) * 100)}%
                        <br />
                        <span className="text-muted-foreground">
                          ({td("mcqTfOnly")})
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Answers Section */}
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{td("studentAnswers")}</h2>
                <p className="text-sm text-muted-foreground">
                  {submission.questions.length}{" "}
                  {submission.questions.length === 1
                    ? td("questionSingular")
                    : td("questionPlural")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {submission.questions.map((q, idx) => (
                <QuestionAnswer index={idx} key={q.id} q={q} />
              ))}
            </div>
          </div>
        </div>

        {/* Grading Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-6 border-border/50 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                {t("gradeSubmission")}
              </CardTitle>
              <CardDescription>
                {submission.status === "graded"
                  ? td("submissionHasBeenGraded")
                  : td("enterScoreToGrade")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submission.status === "graded" && !isEditingGrade ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-500/10 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-700 dark:text-green-400">
                      <Award className="h-6 w-6" />
                      {Math.round(Number(submission.score) * 100)}%
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-green-700/80 dark:text-green-400/80">
                      {td("gradedScore")}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleEditGrade}
                    size="lg"
                    variant="outline"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {td("editGrade")}
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmitGrade}>
                  <div className="space-y-2">
                    <Label
                      className="flex items-center gap-2 text-sm font-semibold"
                      htmlFor="score"
                    >
                      <Award className="h-4 w-4" />
                      {t("setScore")}
                    </Label>
                    <div className="relative">
                      <Input
                        className="text-lg font-semibold"
                        dir={locale === "ar" ? "rtl" : "ltr"}
                        id="score"
                        max={100}
                        min={0}
                        onChange={(e) => setScoreInput(e.target.value)}
                        placeholder={td("enterScorePlaceholder")}
                        type="number"
                        value={scoreInput}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {td("enterValueBetween")}
                    </p>
                  </div>

                  {submission.autoScore != null && !isEditingGrade && (
                    <Alert className="border-blue-500/20 bg-blue-500/5">
                      <AlertDescription className="text-xs">
                        💡{" "}
                        <span className="font-semibold">
                          {td("suggestionLabel")}:
                        </span>{" "}
                        {td("autoCalculatedScore")}{" "}
                        {Math.round(Number(submission.autoScore) * 100)}% (
                        {td("basedOnMcqTf")})
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    {isEditingGrade && (
                      <Button
                        className="flex-1"
                        onClick={handleCancelEdit}
                        size="lg"
                        type="button"
                        variant="outline"
                      >
                        {tc("cancel")}
                      </Button>
                    )}
                    <Button
                      className={cn(isEditingGrade ? "flex-1" : "w-full")}
                      disabled={gradeMutation.isPending}
                      size="lg"
                      type="submit"
                    >
                      {gradeMutation.isPending ? (
                        <>
                          <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                          {td("savingGrade")}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {isEditingGrade
                            ? td("updateGrade")
                            : t("submitGrade")}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Quiz Info Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">{td("quizDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {td("quizTitle")}:
                </span>
                <span className="max-w-[180px] truncate font-medium">
                  {submission.quiz.title}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {td("totalQuestions")}:
                </span>
                <Badge variant="secondary">{submission.questions.length}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("status")}:</span>
                {getStatusBadge()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
