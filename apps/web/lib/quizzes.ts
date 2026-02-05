import { SelectQuizAnswer } from "@lms-saas/shared-lib";
import {
  CompleteQuizDto,
  CreateQuizAnswerDto,
  CreateQuizDto,
  CreateQuizQuestionDto,
  ResumeQuizDto,
  SaveAnswerDto,
  StartQuizDto,
  SubmittedAnswer,
  UpdateQuizAnswerDto,
  UpdateQuizDto,
  UpdateQuizQuestionDto,
} from "@lms-saas/shared-lib/dtos";
import { z } from "zod";
import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

const baseUrl = `${BACKEND_URL}/lessons`;

export interface Quiz {
  id: string;
  title: string;
  duration: number;
  allowMultipleAttempts?: boolean;
  questions: Array<QuizQuestion>;
}

export interface StartQuizResponse {
  submissionId: number;
  attempt: number;
  startedAt: string;
  timeRemaining: number;
}

export interface SaveAnswerResponse {
  success: boolean;
  timeRemaining: number;
}

export interface ResumeQuizResponse {
  submissionId: number;
  attempt: number;
  startedAt: string;
  timeRemaining: number;
  savedAnswers: Record<number, number>;
}

export interface QuizQuestion {
  id: number;
  questionText: string;
  // Backend now exposes an explicit question type. It is currently used
  // only to distinguish between multiple choice and true/false questions.
  // Short-answer questions are not modelled or supported.
  questionType: "mcq" | "true_false";
  orderIndex: number;
  answers: QuizAnswer[];
}

export type QuizAnswer = SelectQuizAnswer;

export interface QuizResults {
  id: number;
  score: string;
  quiz: {
    id: string;
    title: string;
  };
  questions: {
    id: number;
    questionText: string;
    correctAnswer: {
      id: number;
      answerText: string;
    };
    submittedAnswer: {
      id: number;
      answerText: string;
    };
  }[];
}

export const createQuizSchema = z.object({
  title: z.string().min(3).max(255),
  duration: z.coerce.number().min(1),
  allowMultipleAttempts: z.boolean().default(false),
});

export const createQuiz = (lessonId: number, input: CreateQuizDto) => {
  return authFetch<Quiz>(`${baseUrl}/${lessonId}/quizzes`, {
    method: "POST",
    data: input,
  });
};

export const updateQuiz = (
  lessonId: number,
  quizId: string,
  input: UpdateQuizDto
) => {
  return authFetch<Quiz>(`${baseUrl}/${lessonId}/quizzes/${quizId}`, {
    method: "PUT",
    data: input,
  });
};

export const deleteQuiz = (lessonId: number, quizId: string) => {
  return authFetch<{ id: number }>(`${baseUrl}/${lessonId}/quizzes/${quizId}`, {
    method: "DELETE",
  });
};

export const findQuiz = (quizId: string) => {
  return authFetch<Quiz>(`${baseUrl}/1/quizzes/${quizId}`, {
    method: "GET",
  });
};

export const checkIfQuizCompleted = async (
  quizId: string,
  enrollmentId: number
) => {
  const query = enrollmentId ? `?enrollmentId=${enrollmentId}` : "";
  return authFetch<{ completed: boolean }>(
    `${baseUrl}/1/quizzes/${quizId}/completed${query}`,
    {
      method: "GET",
    }
  );
};

export const createQuestion = async (
  quizId: string,
  data: CreateQuizQuestionDto
) => {
  return authFetch<QuizQuestion>(`${baseUrl}/1/quizzes/${quizId}/questions`, {
    method: "POST",
    data,
  });
};

export const updateQuestion = async (
  questionId: number,
  data: UpdateQuizQuestionDto
) => {
  return authFetch<QuizQuestion>(
    `${baseUrl}/1/quizzes/${crypto.randomUUID()}/questions/${questionId}`,
    {
      method: "PUT",
      data,
    }
  );
};

export const deleteQuestion = async (questionId: number) => {
  return authFetch(
    `${baseUrl}/1/quizzes/${crypto.randomUUID()}/questions/${questionId}`,
    {
      method: "DELETE",
    }
  );
};

export const addAnswer = async (
  questionId: number,
  data: CreateQuizAnswerDto
) => {
  return authFetch<QuizAnswer>(
    `${baseUrl}/1/quizzes/${crypto.randomUUID()}/questions/${questionId}/answers`,
    {
      method: "POST",
      data,
    }
  );
};

export const updateAnswer = async (
  answerId: number,
  data: UpdateQuizAnswerDto
) => {
  return authFetch<{ id: number }>(
    `${baseUrl}/1/quizzes/${crypto.randomUUID()}/questions/1/answers/${answerId}`,
    {
      method: "PUT",
      data,
    }
  );
};

export const deleteAnswer = async (answerId: number) => {
  return authFetch<{ id: number }>(
    `${baseUrl}/1/quizzes/${crypto.randomUUID()}/questions/1/answers/${answerId}`,
    {
      method: "DELETE",
    }
  );
};

/**
 * Start a new quiz attempt
 * Creates a quiz submission with server-side timer
 */
export const startQuiz = async (quizId: string, enrollmentId: number) => {
  return authFetch<StartQuizResponse>(`${baseUrl}/1/quizzes/${quizId}/start`, {
    method: "POST",
    data: { enrollmentId } as StartQuizDto,
  });
};

/**
 * Save an answer during quiz taking (auto-save)
 * Updates quiz_responses table
 */
export const saveAnswer = async (
  quizId: string,
  submissionId: number,
  questionId: number,
  answerId: number
) => {
  return authFetch<SaveAnswerResponse>(
    `${baseUrl}/1/quizzes/${quizId}/save-answer`,
    {
      method: "POST",
      data: {
        submissionId,
        questionId,
        answerId,
      } as SaveAnswerDto,
    }
  );
};

/**
 * Resume an in-progress quiz
 * Returns submission with saved answers and time remaining
 */
export const resumeQuiz = async (quizId: string, enrollmentId: number) => {
  return authFetch<ResumeQuizResponse>(
    `${baseUrl}/1/quizzes/${quizId}/resume?enrollmentId=${enrollmentId}`,
    {
      method: "GET",
    }
  );
};

/**
 * Submit completed quiz
 * Finalizes submission and calculates score
 */
export const submitQuiz = async (
  quizId: string,
  enrollmentId: number,
  answers: SubmittedAnswer[]
) => {
  return authFetch<void>(`${baseUrl}/1/quizzes/${quizId}/submit`, {
    method: "POST",
    data: { enrollmentId, answers } as CompleteQuizDto,
  });
};

export const isQuizCompleted = async (quizId: string) => {
  return authFetch<{ completed: boolean }>(
    `${baseUrl}/1/quizzes/${quizId}/completed`,
    {
      method: "GET",
    }
  );
};

export const getQuizResults = async (quizId: string) => {
  return authFetch<QuizResults>(`${baseUrl}/1/quizzes/${quizId}/results`, {
    method: "GET",
  });
};
