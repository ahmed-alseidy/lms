"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteDialogsProps {
  deleteQuestionId: number | null;
  deleteAnswerId: {
    questionId: number;
    answerId: number;
  } | null;
  onDeleteQuestion: (questionId: number) => void;
  onDeleteAnswer: (questionId: number, answerId: number) => void;
  onCloseQuestionDialog: () => void;
  onCloseAnswerDialog: () => void;
}

export function DeleteDialogs({
  deleteQuestionId,
  deleteAnswerId,
  onDeleteQuestion,
  onDeleteAnswer,
  onCloseQuestionDialog,
  onCloseAnswerDialog,
}: DeleteDialogsProps) {
  const t = useTranslations();

  return (
    <>
      {/* Delete Question Confirmation Dialog */}
      <AlertDialog
        onOpenChange={(open) => !open && onCloseQuestionDialog()}
        open={deleteQuestionId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("quizzes.deleteQuestion") || "Delete Question"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("quizzes.deleteQuestionConfirmation") ||
                "Are you sure you want to delete this question? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteQuestionId && onDeleteQuestion(deleteQuestionId)
              }
              variant="destructive"
            >
              {t("common.delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Answer Confirmation Dialog */}
      <AlertDialog
        onOpenChange={(open) => !open && onCloseAnswerDialog()}
        open={deleteAnswerId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("quizzes.deleteAnswer") || "Delete Answer"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("quizzes.deleteAnswerConfirmation") ||
                "Are you sure you want to delete this answer? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteAnswerId &&
                onDeleteAnswer(
                  deleteAnswerId.questionId,
                  deleteAnswerId.answerId
                )
              }
              variant="destructive"
            >
              {t("common.delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
