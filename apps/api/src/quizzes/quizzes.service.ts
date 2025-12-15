import {
  CompleteQuizDto,
  CreateQuizAnswerDto,
  CreateQuizDto,
  CreateQuizQuestionDto,
  db,
  lessons,
  quizAnswers,
  quizQuestions,
  quizSubmissions,
  quizzes,
  studentLessonCompletions,
  studentVideoCompletions,
  submittedQuestionAnswers,
  UpdateQuizAnswerDto,
  UpdateQuizDto,
  UpdateQuizQuestionDto,
} from "@lms-saas/shared-lib";
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { attempt } from "@/utils/error-handling";

@Injectable()
export class QuizzesService {
  async create(lessonId: number, dto: CreateQuizDto) {
    const [quiz] = await db
      .insert(quizzes)
      .values({
        ...dto,
        lessonId,
      })
      .returning({
        id: quizzes.id,
        title: quizzes.title,
        duration: quizzes.duration,
      });

    return quiz;
  }

  async findOne(id: string) {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
      columns: {
        createdAt: false,
        updatedAt: false,
        lessonId: false,
      },
      with: {
        questions: {
          orderBy: [asc(quizQuestions.orderIndex)],
          columns: {
            quizId: false,
          },
          with: {
            answers: {
              columns: {
                questionId: false,
              },
            },
          },
        },
      },
    });

    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto) {
    const quiz = await db.transaction(async (tx) => {
      const [quiz] = await db
        .update(quizzes)
        .set(dto)
        .where(eq(quizzes.id, id))
        .returning({
          id: quizzes.id,
        });

      if (dto.questions) {
        await tx.delete(quizQuestions).where(eq(quizQuestions.quizId, id));

        await tx.insert(quizQuestions).values(
          dto.questions.map((question) => ({
            quizId: id,
            questionText: question.questionText!,
            orderIndex: question.orderIndex!,
          }))
        );
      }

      return quiz;
    });

    return quiz;
  }

  async delete(id: string) {
    const [quiz] = await db
      .delete(quizzes)
      .where(eq(quizzes.id, id))
      .returning({ id: quizzes.id });

    return quiz;
  }

  // Question operations
  async createQuestion(quizId: string, dto: CreateQuizQuestionDto) {
    const [question] = await db.transaction(async (tx) => {
      // Create question
      const [newQuestion] = await tx
        .insert(quizQuestions)
        .values({
          quizId,
          questionText: dto.questionText,
          questionType: dto.questionType,
          orderIndex: dto.orderIndex,
        })
        .returning();

      // Create answers
      let answers;
      if (dto.answers && dto.answers.length > 0) {
        answers = await tx
          .insert(quizAnswers)
          .values(
            dto.answers.map((answer) => ({
              questionId: newQuestion.id,
              answerText: answer.answerText,
              isCorrect: answer.isCorrect,
            }))
          )
          .returning({
            id: quizAnswers.id,
            answerText: quizAnswers.answerText,
            isCorrect: quizAnswers.isCorrect,
          });
      }
      newQuestion["answers"] = answers;

      return [newQuestion];
    });

    return question;
  }

  async findQuestion(id: number) {
    const [question] = await db
      .select({
        id: quizQuestions.id,
        questionText: quizQuestions.questionText,
        orderIndex: quizQuestions.orderIndex,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.id, id));

    if (question) {
      const answers = await db
        .select({
          id: quizAnswers.id,
          answerText: quizAnswers.answerText,
          isCorrect: quizAnswers.isCorrect,
        })
        .from(quizAnswers)
        .where(eq(quizAnswers.questionId, id));

      return { ...question, answers };
    }

    return question;
  }

  async updateQuestion(id: number, dto: UpdateQuizQuestionDto) {
    const [question] = await db.transaction(async (tx) => {
      const [updatedQuestion] = await tx
        .update(quizQuestions)
        .set({
          questionText: dto.questionText,
          questionType: dto.questionType,
          orderIndex: dto.orderIndex,
        })
        .where(eq(quizQuestions.id, id))
        .returning({
          id: quizQuestions.id,
        });

      if (dto.answers) {
        await tx.delete(quizAnswers).where(eq(quizAnswers.questionId, id));

        // Insert new answers
        if (dto.answers.length > 0) {
          await tx.insert(quizAnswers).values(
            dto.answers.map((answer) => ({
              questionId: id,
              answerText: answer.answerText!,
              isCorrect: answer.isCorrect,
            }))
          );
        }
      }

      return [updatedQuestion];
    });

    return question;
  }

  async deleteQuestion(id: number) {
    const [question] = await db
      .delete(quizQuestions)
      .where(eq(quizQuestions.id, id))
      .returning({ id: quizQuestions.id });

    return question;
  }

  async getQuizQuestions(quizId: string) {
    const questions = await db
      .select({
        id: quizQuestions.id,
        questionText: quizQuestions.questionText,
        questionType: quizQuestions.questionType,
        orderIndex: quizQuestions.orderIndex,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.orderIndex);

    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await db
          .select({
            id: quizAnswers.id,
            answerText: quizAnswers.answerText,
            isCorrect: quizAnswers.isCorrect,
          })
          .from(quizAnswers)
          .where(eq(quizAnswers.questionId, question.id));
        return { ...question, answers };
      })
    );

    return questionsWithAnswers;
  }

  async deleteAnswer(answerId: number) {
    try {
      await db
        .delete(quizAnswers)
        .where(eq(quizAnswers.id, answerId))
        .returning({
          id: quizAnswers.id,
        });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete answer. ${error}`
      );
    }
  }
  async updateAnswer(answerId: number, dto: UpdateQuizAnswerDto) {
    try {
      const [answer] = await db
        .update(quizAnswers)
        .set(dto)
        .where(eq(quizAnswers.id, answerId))
        .returning({
          id: quizAnswers.id,
        });

      return answer;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update answer. ${error}`
      );
    }
  }

  async createAnswer(questionId: number, dto: CreateQuizAnswerDto) {
    try {
      const [answer] = await db
        .insert(quizAnswers)
        .values({
          questionId,
          answerText: dto.answerText,
          isCorrect: dto.isCorrect,
        })
        .returning({
          id: quizAnswers.id,
          answerText: quizAnswers.answerText,
          isCorrect: quizAnswers.isCorrect,
        });

      return answer;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create answer. ${error}`
      );
    }
  }

  async completeQuiz(quizId: string, studentId: number, dto: CompleteQuizDto) {
    // Check if quiz exists
    const [quiz, quizError] = await attempt(
      db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
        columns: {
          id: true,
          lessonId: true,
        },
      })
    );

    if (quizError) {
      throw quizError;
    }

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    const [, error] = await attempt(
      db.transaction(async (tx) => {
        // Check if quiz is already completed
        const quizCompletion = await tx.query.quizSubmissions.findFirst({
          where: and(
            eq(quizSubmissions.enrollmentId, dto.enrollmentId),
            eq(quizSubmissions.quizId, quizId)
          ),
        });

        if (quizCompletion) {
          throw new ConflictException("Quiz already completed");
        }

        // TODO: Add multiple answers logic
        // Calculate score
        const questionsIds = dto.answers.map((a) => a.questionId);
        const answersIds = dto.answers.map((a) => a.answerId);

        const submittedAnswers = await tx.query.quizAnswers.findMany({
          where: and(
            inArray(quizAnswers.questionId, questionsIds),
            inArray(quizAnswers.id, answersIds)
          ),
          columns: {
            isCorrect: true,
          },
        });

        let score = 0;
        for (const answer of submittedAnswers) {
          score += answer.isCorrect ? 1 : 0;
        }

        const [totalQuestionsCount] = await tx
          .select({
            count: count(quizQuestions.id),
          })
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, quizId));

        score /= totalQuestionsCount.count;

        // Create quiz completion
        const [quizCompletionInsertionResult] = await tx
          .insert(quizSubmissions)
          .values({
            enrollmentId: dto.enrollmentId,
            quizId,
            studentId,
            score: score.toString(),
          })
          .returning({
            id: quizSubmissions.id,
          });

        // Insert submitted questions
        const correctAnswers = await tx.query.quizAnswers.findMany({
          where: and(
            inArray(quizAnswers.questionId, questionsIds),
            eq(quizAnswers.isCorrect, true)
          ),
          columns: {
            id: true,
            questionId: true,
          },
        });

        if (correctAnswers.length > 0) {
          await tx.insert(submittedQuestionAnswers).values(
            dto.answers.map((a) => ({
              submissionId: quizCompletionInsertionResult.id,
              answerId: a.answerId,
              questionId: a.questionId,
              correctAnswerId: correctAnswers.find(
                (c) => c.questionId === a.questionId
              )?.id!,
            }))
          );
        }

        const lessonId = quiz.lessonId;
        // Get lesson with quizzes and student quiz completion
        const lesson = await tx.query.lessons.findFirst({
          where: eq(lessons.id, lessonId),
          columns: {
            id: true,
          },
          with: {
            videos: {
              columns: {
                id: true,
              },
              with: {
                studentVideoCompletions: {
                  columns: {
                    id: true,
                  },
                  where: eq(
                    studentVideoCompletions.enrollmentId,
                    dto.enrollmentId
                  ),
                },
              },
            },
          },
        });

        if (!lesson) throw new NotFoundException("Lesson not found");

        // Break if lesson has quizzes and student has not completed any of them
        if (
          lesson.videos.length > 0 &&
          lesson.videos.some(
            (video) => video.studentVideoCompletions.length === 0
          )
        ) {
          return;
        }

        const completion = await tx.query.studentLessonCompletions.findFirst({
          where: and(
            eq(studentLessonCompletions.enrollmentId, dto.enrollmentId),
            eq(studentLessonCompletions.lessonId, lessonId)
          ),
        });

        if (!completion) {
          await tx.insert(studentLessonCompletions).values({
            enrollmentId: dto.enrollmentId,
            lessonId,
          });
        }
      })
    );

    if (error) {
      throw error;
    }
  }

  async checkIfCompleted(quizId: string, studentId: number) {
    const [result, error] = await attempt(
      db.query.quizSubmissions.findFirst({
        where: and(
          eq(quizSubmissions.quizId, quizId),
          eq(quizSubmissions.studentId, studentId)
        ),
      })
    );

    if (error) {
      throw error;
    }

    return {
      completed: !!result,
    };
  }

  async getQuizResults(studentId: number, quizId: string) {
    const [response, error] = await attempt(
      db.query.quizSubmissions.findFirst({
        where: and(
          eq(quizSubmissions.quizId, quizId),
          eq(quizSubmissions.studentId, studentId)
        ),
        columns: {
          score: true,
          id: true,
        },
        with: {
          quiz: {
            columns: {
              id: true,
              title: true,
            },
            with: {
              questions: {
                columns: {
                  id: true,
                  questionText: true,
                },
                with: {
                  answers: {
                    columns: {
                      id: true,
                      answerText: true,
                    },
                    where: eq(quizAnswers.isCorrect, true),
                  },
                },
              },
            },
          },
          submittedQuestionAnswers: {
            columns: {
              id: true,
            },
            with: {
              question: {
                columns: {
                  id: true,
                },
              },
              answer: {
                columns: {
                  id: true,
                  answerText: true,
                },
              },
            },
          },
        },
      })
    );

    const quizQuestions = response?.quiz.questions;
    const submittedQuestionAnswers = response?.submittedQuestionAnswers;
    const questionsResult = quizQuestions?.map((q) => {
      const submittedAnswer = submittedQuestionAnswers?.find(
        (a) => a.question.id === q.id
      );

      const { answers, ...rest } = q;

      return {
        ...rest,
        correctAnswer: answers[0],
        submittedAnswer: submittedAnswer?.answer,
      };
    });

    if (error) {
      throw error;
    }

    return {
      id: response?.id,
      score: response?.score,
      quiz: {
        id: response?.quiz.id,
        title: response?.quiz.title,
      },
      questions: questionsResult,
    };
  }
}
