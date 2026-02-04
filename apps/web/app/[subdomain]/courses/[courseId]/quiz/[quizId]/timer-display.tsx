"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export const TimerDisplay = ({
  timeRemaining,
  isTimerExpired,
}: {
  timeRemaining: number | null;
  isTimerExpired: boolean;
}) => {
  const t = useTranslations();
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const getTimeColor = useCallback((seconds: number) => {
    if (seconds <= 300) return "text-red-500"; // Last 5 minutes
    if (seconds <= 600) return "text-yellow-500"; // Last 10 minutes
    return "text-green-500";
  }, []);

  if (timeRemaining === null) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <span className="text-sm font-medium">
          {t("quizzes.timeRemaining")} :
        </span>
        <span className={`text-lg font-bold ${getTimeColor(timeRemaining)}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      {isTimerExpired && (
        <div className="text-sm font-medium text-red-500">
          {t("quizzes.timeIsUpSubmittingQuizAutomatically")}
        </div>
      )}
    </div>
  );
};
