import { SelectQuizAnswer } from "@lms-saas/shared-lib";
import {
  CompleteQuizDto,
  CreateQuizAnswerDto,
  CreateQuizDto,
  CreateQuizQuestionDto,
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
  questions: Array<QuizQuestion>;
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
  return authFetch<{ completed: boolean }>(
    `${baseUrl}/1/quizzes/${quizId}/completed?enrollmentId=${enrollmentId}`,
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
