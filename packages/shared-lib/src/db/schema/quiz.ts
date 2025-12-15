import { InferSelectModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { enrollments, lessons } from "./course";
import { students } from "./user";

// NOTE: We explicitly restrict quiz question types to multiple choice (mcq)
// and true/false (true_false). Short answer style questions are intentionally
// not supported in this schema to keep grading fully automatic.
export const questionTypeEnum = pgEnum("question_type", ["mcq", "true_false"]);

export const quizzes = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: uuid("quiz_id")
    .references(() => quizzes.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  questionText: text("question_text").notNull(),
  // Question type is stored explicitly so we can support different UI/UX
  // behaviours and analytics per type. Only "mcq" and "true_false" are
  // allowed. We default to "mcq" for backwards compatibility with existing
  // data that did not distinguish types.
  questionType: questionTypeEnum("question_type").notNull().default("mcq"),
  orderIndex: integer("order_index").notNull(),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .references(() => quizQuestions.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  answerText: text("answer_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
});

export const submittedQuestionAnswers = pgTable(
  "submitted_question_answers",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .references(() => quizQuestions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    answerId: integer("answer_id")
      .references(() => quizAnswers.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    submissionId: integer("submission_id")
      .references(() => quizSubmissions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
  },
  (t) => [
    unique("submitted_question_answer_unique").on(t.questionId, t.answerId),
  ]
);

export const quizSubmissions = pgTable(
  "quiz_submissions",
  {
    id: serial("id").primaryKey(),
    enrollmentId: integer("enrollment_id")
      .references(() => enrollments.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      })
      .notNull(),

    quizId: uuid("quiz_id")
      .references(() => quizzes.id, {
        onDelete: "cascade",
      })
      .notNull(),
    studentId: integer("student_id")
      .references(() => students.id, {
        onDelete: "cascade",
      })
      .notNull(),
    score: numeric("score", { precision: 10, scale: 2 }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique("quiz_submission_unique")
      .on(t.enrollmentId, t.quizId)
      .nullsNotDistinct(),
  ]
);

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(quizQuestions),
  quizSubmissions: many(quizSubmissions),
}));

export const quizQuestionsRelations = relations(
  quizQuestions,
  ({ one, many }) => ({
    quiz: one(quizzes, {
      fields: [quizQuestions.quizId],
      references: [quizzes.id],
    }),
    answers: many(quizAnswers),
    submittedQuestionAnswers: many(submittedQuestionAnswers),
  })
);

export const quizAnswersRelations = relations(quizAnswers, ({ one, many }) => ({
  question: one(quizQuestions, {
    fields: [quizAnswers.questionId],
    references: [quizQuestions.id],
  }),
  submittedQuestionAnswers: many(submittedQuestionAnswers),
}));

export const quizSubmissionsRelations = relations(
  quizSubmissions,
  ({ one, many }) => ({
    quiz: one(quizzes, {
      fields: [quizSubmissions.quizId],
      references: [quizzes.id],
    }),
    enrollment: one(enrollments, {
      fields: [quizSubmissions.enrollmentId],
      references: [enrollments.id],
    }),
    student: one(students, {
      fields: [quizSubmissions.studentId],
      references: [students.id],
    }),
    submittedQuestionAnswers: many(submittedQuestionAnswers),
  })
);

export const submittedQuestionAnswersRelations = relations(
  submittedQuestionAnswers,
  ({ one }) => ({
    question: one(quizQuestions, {
      fields: [submittedQuestionAnswers.questionId],
      references: [quizQuestions.id],
    }),
    answer: one(quizAnswers, {
      fields: [submittedQuestionAnswers.answerId],
      references: [quizAnswers.id],
    }),
    submission: one(quizSubmissions, {
      fields: [submittedQuestionAnswers.submissionId],
      references: [quizSubmissions.id],
    }),
  })
);

export type SelectQuiz = InferSelectModel<typeof quizzes>;
export type SelectQuizQuestion = InferSelectModel<typeof quizQuestions>;
export type SelectQuizAnswer = InferSelectModel<typeof quizAnswers>;
export type SelectQuizSubmission = InferSelectModel<typeof quizSubmissions>;
export type SelectSubmittedQuestionAnswer = InferSelectModel<
  typeof submittedQuestionAnswers
>;
