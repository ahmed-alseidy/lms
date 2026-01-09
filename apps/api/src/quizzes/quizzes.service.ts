import {
  CompleteQuizDto,
  CreateQuizAnswerDto,
  CreateQuizDto,
  CreateQuizQuestionDto,
  db,
  enrollments,
  lessons,
  quizAnswers,
  quizQuestions,
  quizResponses,
  quizSubmissions,
  quizzes,
  ResumeQuizDto,
  SaveAnswerDto,
  StartQuizDto,
  studentLessonCompletions,
  studentVideoCompletions,
  submittedQuestionAnswers,
  UpdateQuizAnswerDto,
  UpdateQuizDto,
  UpdateQuizQuestionDto,
} from "@lms-saas/shared-lib";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, count, desc, eq, inArray, max, sql } from "drizzle-orm";
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
    const updateData: Partial<typeof quizzes.$inferInsert> = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }
    if (dto.duration !== undefined) {
      updateData.duration = dto.duration;
    }
    if (dto.allowMultipleAttempts !== undefined) {
      updateData.allowMultipleAttempts = dto.allowMultipleAttempts;
    }

    const [quiz] = await db
      .update(quizzes)
      .set(updateData)
      .where(eq(quizzes.id, id))
      .returning({
        id: quizzes.id,
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
    console.log("dto", dto);
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
        console.log("answers", answers);
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

  /**
   * Start a new quiz attempt for a student
   * Creates a quiz submission record with started_at timestamp
   */
  async startQuiz(quizId: string, studentId: number, dto: StartQuizDto) {
    const [quiz, quizError] = await attempt(
      db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
        columns: {
          id: true,
          allowMultipleAttempts: true,
          duration: true,
        },
      })
    );

    if (quizError) {
      throw quizError;
    }

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    // Check if student is enrolled
    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, dto.enrollmentId),
      columns: {
        id: true,
        studentId: true,
      },
    });

    if (!enrollment || enrollment.studentId !== studentId) {
      throw new NotFoundException("Enrollment not found");
    }

    // Check for existing in-progress submission
    const inProgressSubmission = await db.query.quizSubmissions.findFirst({
      where: and(
        eq(quizSubmissions.quizId, quizId),
        eq(quizSubmissions.enrollmentId, dto.enrollmentId),
        eq(quizSubmissions.completed, false)
      ),
    });

    if (inProgressSubmission) {
      // Return existing in-progress submission
      return {
        submissionId: inProgressSubmission.id,
        attempt: inProgressSubmission.attempt,
        startedAt: inProgressSubmission.startedAt,
        timeRemaining: this.calculateTimeRemaining(
          inProgressSubmission.startedAt,
          quiz.duration
        ),
      };
    }

    // Get the next attempt number
    const [maxAttempt] = await db
      .select({ maxAttempt: max(quizSubmissions.attempt) })
      .from(quizSubmissions)
      .where(
        and(
          eq(quizSubmissions.quizId, quizId),
          eq(quizSubmissions.enrollmentId, dto.enrollmentId)
        )
      );

    const nextAttempt = (maxAttempt?.maxAttempt || 0) + 1;

    // Check if multiple attempts are allowed
    if (nextAttempt > 1 && !quiz.allowMultipleAttempts) {
      throw new ConflictException(
        "Multiple attempts not allowed for this quiz"
      );
    }

    // Create new submission
    const [submission] = await db
      .insert(quizSubmissions)
      .values({
        quizId,
        enrollmentId: dto.enrollmentId,
        studentId,
        attempt: nextAttempt,
        startedAt: sql`CURRENT_TIMESTAMP`,
        completed: false,
      })
      .returning({
        id: quizSubmissions.id,
        attempt: quizSubmissions.attempt,
        startedAt: quizSubmissions.startedAt,
      });

    return {
      submissionId: submission.id,
      attempt: submission.attempt,
      startedAt: submission.startedAt,
      timeRemaining: quiz.duration * 60, // Convert minutes to seconds
    };
  }

  /**
   * Save or update an answer during quiz taking (auto-save)
   * Stores answer in quiz_responses table (can be updated until submission)
   */
  async saveAnswer(quizId: string, studentId: number, dto: SaveAnswerDto) {
    // Verify submission belongs to student and quiz
    const submission = await db.query.quizSubmissions.findFirst({
      where: and(
        eq(quizSubmissions.id, dto.submissionId),
        eq(quizSubmissions.studentId, studentId),
        eq(quizSubmissions.quizId, quizId),
        eq(quizSubmissions.completed, false) // Can't save answers to completed quiz
      ),
      columns: {
        id: true,
        startedAt: true,
      },
    });

    if (!submission) {
      throw new NotFoundException("Active quiz submission not found");
    }

    // Verify question belongs to quiz
    const question = await db.query.quizQuestions.findFirst({
      where: and(
        eq(quizQuestions.id, dto.questionId),
        eq(quizQuestions.quizId, quizId)
      ),
      columns: {
        id: true,
      },
    });

    if (!question) {
      throw new NotFoundException("Question not found in this quiz");
    }

    // Verify answer belongs to question
    const answer = await db.query.quizAnswers.findFirst({
      where: and(
        eq(quizAnswers.id, dto.answerId),
        eq(quizAnswers.questionId, dto.questionId)
      ),
      columns: {
        id: true,
      },
    });

    if (!answer) {
      throw new NotFoundException("Answer not found for this question");
    }

    // Check if time has expired
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      columns: {
        duration: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    const timeRemaining = this.calculateTimeRemaining(
      submission.startedAt,
      quiz.duration
    );

    if (timeRemaining <= 0) {
      throw new BadRequestException("Quiz time has expired");
    }

    // Upsert answer (insert or update)
    await db
      .insert(quizResponses)
      .values({
        submissionId: dto.submissionId,
        questionId: dto.questionId,
        answerId: dto.answerId,
      })
      .onConflictDoUpdate({
        target: [quizResponses.submissionId, quizResponses.questionId],
        set: {
          answerId: dto.answerId,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    return {
      success: true,
      timeRemaining,
    };
  }

  /**
   * Resume an in-progress quiz
   * Returns submission with saved answers and time remaining
   */
  async resumeQuiz(quizId: string, studentId: number, dto: ResumeQuizDto) {
    const submission = await db.query.quizSubmissions.findFirst({
      where: and(
        eq(quizSubmissions.quizId, quizId),
        eq(quizSubmissions.enrollmentId, dto.enrollmentId),
        eq(quizSubmissions.studentId, studentId),
        eq(quizSubmissions.completed, false)
      ),
      columns: {
        id: true,
        attempt: true,
        startedAt: true,
      },
      with: {
        quizResponses: {
          columns: {
            questionId: true,
            answerId: true,
          },
        },
      },
      orderBy: [desc(quizSubmissions.startedAt)],
    });

    if (!submission) {
      throw new NotFoundException("No in-progress quiz found");
    }

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      columns: {
        duration: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    const timeRemaining = this.calculateTimeRemaining(
      submission.startedAt,
      quiz.duration
    );

    // Convert responses to map for easy lookup
    const savedAnswers: Record<number, number> = {};
    for (const response of submission.quizResponses) {
      savedAnswers[response.questionId] = response.answerId;
    }

    return {
      submissionId: submission.id,
      attempt: submission.attempt,
      startedAt: submission.startedAt,
      timeRemaining: Math.max(0, timeRemaining),
      savedAnswers,
    };
  }

  /**
   * Calculate time remaining in seconds
   */
  private calculateTimeRemaining(
    startedAt: Date,
    durationMinutes: number
  ): number {
    const now = new Date();
    const started = new Date(startedAt);
    const elapsedSeconds = Math.floor(
      (now.getTime() - started.getTime()) / 1000
    );
    const totalSeconds = durationMinutes * 60;
    return Math.max(0, totalSeconds - elapsedSeconds);
  }

  async completeQuiz(quizId: string, studentId: number, dto: CompleteQuizDto) {
    // Check if quiz exists
    const [quiz, quizError] = await attempt(
      db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
        columns: {
          id: true,
          lessonId: true,
          duration: true,
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
        // Find the active (in-progress) submission
        const submission = await tx.query.quizSubmissions.findFirst({
          where: and(
            eq(quizSubmissions.enrollmentId, dto.enrollmentId),
            eq(quizSubmissions.quizId, quizId),
            eq(quizSubmissions.studentId, studentId),
            eq(quizSubmissions.completed, false)
          ),
          columns: {
            id: true,
            startedAt: true,
            attempt: true,
          },
          with: {
            quizResponses: {
              columns: {
                questionId: true,
                answerId: true,
              },
            },
          },
          orderBy: [desc(quizSubmissions.startedAt)],
        });

        if (!submission) {
          throw new NotFoundException("No active quiz submission found");
        }

        // Check if time has expired
        const timeRemaining = this.calculateTimeRemaining(
          submission.startedAt,
          quiz.duration
        );

        if (timeRemaining <= 0) {
          throw new BadRequestException("Quiz time has expired");
        }

        // Use saved responses from quiz_responses, or fall back to dto.answers
        const answersToGrade =
          submission.quizResponses.length > 0
            ? submission.quizResponses.map((r) => ({
                questionId: r.questionId,
                answerId: r.answerId,
              }))
            : dto.answers;

        // Calculate score based on correct answers
        const questionsIds = answersToGrade.map((a) => a.questionId);
        const answersIds = answersToGrade.map((a) => a.answerId);

        const submittedAnswers = await tx.query.quizAnswers.findMany({
          where: and(
            inArray(quizAnswers.questionId, questionsIds),
            inArray(quizAnswers.id, answersIds)
          ),
          columns: {
            questionId: true,
            isCorrect: true,
          },
        });

        // Count correct answers per question
        const correctAnswersByQuestion = new Map<number, boolean>();
        for (const answer of submittedAnswers) {
          const existing = correctAnswersByQuestion.get(answer.questionId);
          // For MCQ/TrueFalse, only one answer per question, so this is correct
          correctAnswersByQuestion.set(answer.questionId, answer.isCorrect);
        }

        let correctCount = 0;
        for (const [questionId, isCorrect] of correctAnswersByQuestion) {
          if (isCorrect) correctCount++;
        }

        const [totalQuestionsCount] = await tx
          .select({
            count: count(quizQuestions.id),
          })
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, quizId));

        const score =
          totalQuestionsCount.count > 0
            ? correctCount / totalQuestionsCount.count
            : 0;

        // Update submission to mark as completed
        await tx
          .update(quizSubmissions)
          .set({
            completed: true,
            score: score.toString(),
            completedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(quizSubmissions.id, submission.id));

        // Copy responses from quiz_responses to submitted_question_answers (final locked answers)
        if (answersToGrade.length > 0) {
          await tx.insert(submittedQuestionAnswers).values(
            answersToGrade.map((a) => ({
              submissionId: submission.id,
              questionId: a.questionId,
              answerId: a.answerId,
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

  /**
   * Get analytics for a quiz (teacher only)
   * Returns average score, attempts per student, question difficulty, completion rate, time spent
   */
  async getQuizAnalytics(quizId: string) {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      columns: {
        id: true,
        title: true,
        duration: true,
      },
      with: {
        questions: {
          columns: {
            id: true,
            questionText: true,
            orderIndex: true,
          },
        },
        quizSubmissions: {
          where: eq(quizSubmissions.completed, true),
          columns: {
            id: true,
            score: true,
            attempt: true,
            startedAt: true,
            completedAt: true,
            studentId: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    const submissions = quiz.quizSubmissions;
    const totalSubmissions = submissions.length;

    if (totalSubmissions === 0) {
      return {
        quiz: {
          id: quiz.id,
          title: quiz.title,
        },
        totalSubmissions: 0,
        averageScore: 0,
        completionRate: 0,
        attemptsPerStudent: [],
        questionDifficulty: [],
        averageTimeSpent: 0,
      };
    }

    // Calculate average score
    const totalScore = submissions.reduce((sum, sub) => {
      return sum + Number(sub.score || 0);
    }, 0);
    const averageScore = totalScore / totalSubmissions;

    // Calculate attempts per student
    const attemptsByStudent = new Map<number, number>();
    for (const submission of submissions) {
      const current = attemptsByStudent.get(submission.studentId) || 0;
      attemptsByStudent.set(submission.studentId, current + 1);
    }

    const attemptsPerStudent = Array.from(attemptsByStudent.entries()).map(
      ([studentId, attempts]) => ({
        studentId,
        attempts,
      })
    );

    // Calculate question difficulty (percentage of correct answers per question)
    const questionDifficulty = await Promise.all(
      quiz.questions.map(async (question) => {
        const [correctSubmissions] = await db
          .select({ count: count(submittedQuestionAnswers.id) })
          .from(submittedQuestionAnswers)
          .innerJoin(
            quizSubmissions,
            eq(submittedQuestionAnswers.submissionId, quizSubmissions.id)
          )
          .innerJoin(
            quizAnswers,
            eq(submittedQuestionAnswers.answerId, quizAnswers.id)
          )
          .where(
            and(
              eq(submittedQuestionAnswers.questionId, question.id),
              eq(quizSubmissions.quizId, quizId),
              eq(quizSubmissions.completed, true),
              eq(quizAnswers.isCorrect, true)
            )
          );

        const [totalAnswers] = await db
          .select({ count: count(submittedQuestionAnswers.id) })
          .from(submittedQuestionAnswers)
          .innerJoin(
            quizSubmissions,
            eq(submittedQuestionAnswers.submissionId, quizSubmissions.id)
          )
          .where(
            and(
              eq(submittedQuestionAnswers.questionId, question.id),
              eq(quizSubmissions.quizId, quizId),
              eq(quizSubmissions.completed, true)
            )
          );

        const correctCount = correctSubmissions[0]?.count || 0;
        const totalCount = totalAnswers[0]?.count || 0;
        const difficulty =
          totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

        return {
          questionId: question.id,
          questionText: question.questionText,
          orderIndex: question.orderIndex,
          correctPercentage: Math.round(difficulty * 100) / 100,
          totalAnswers: totalCount,
          correctAnswers: correctCount,
        };
      })
    );

    // Calculate average time spent (in seconds)
    const timeSpentArray = submissions
      .filter((sub) => sub.startedAt && sub.completedAt)
      .map((sub) => {
        const started = new Date(sub.startedAt);
        const completed = new Date(sub.completedAt!);
        return Math.floor((completed.getTime() - started.getTime()) / 1000);
      });

    const averageTimeSpent =
      timeSpentArray.length > 0
        ? timeSpentArray.reduce((sum, time) => sum + time, 0) /
          timeSpentArray.length
        : 0;

    // Get unique students who completed
    const uniqueStudents = new Set(submissions.map((sub) => sub.studentId));
    const completionRate = (uniqueStudents.size / totalSubmissions) * 100;

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        duration: quiz.duration,
      },
      totalSubmissions,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      attemptsPerStudent,
      questionDifficulty: questionDifficulty.sort(
        (a, b) => a.orderIndex - b.orderIndex
      ),
      averageTimeSpent: Math.round(averageTimeSpent),
      timeSpentDistribution: {
        min: timeSpentArray.length > 0 ? Math.min(...timeSpentArray) : 0,
        max: timeSpentArray.length > 0 ? Math.max(...timeSpentArray) : 0,
        median:
          timeSpentArray.length > 0
            ? timeSpentArray.sort((a, b) => a - b)[
                Math.floor(timeSpentArray.length / 2)
              ]
            : 0,
      },
    };
  }
}
