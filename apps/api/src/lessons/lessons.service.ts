import {
  CreateLessonDto,
  courseSections,
  courses,
  db,
  enrollments,
  lessons,
  quizSubmissions,
  studentLessonCompletions,
  studentVideoCompletions,
  UpdateLessonDto,
  videos,
} from "@lms-saas/shared-lib";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { attempt } from "@/utils/error-handling";

@Injectable()
export class LessonsService {
  async findOne(lessonId: number) {
    try {
      const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: {
          videos: {
            columns: {
              lessonId: false,
              createdAt: false,
            },
          },
          quizzes: {
            columns: {
              lessonId: false,
              createdAt: false,
              updatedAt: false,
            },
          },
        },
      });

      return lesson;
    } catch (error) {
      throw new InternalServerErrorException(`Cannot find lesson. ${error}`);
    }
  }

  async create(courseId: number, sectionId: number, dto: CreateLessonDto) {
    try {
      const [lesson] = await db
        .insert(lessons)
        .values({ ...dto, sectionId })
        .returning({ id: lessons.id });

      await db
        .update(courses)
        .set({
          lessonsCount: sql`lessons_count + 1`,
        })
        .where(eq(courses.id, courseId));

      return lesson;
    } catch (error) {
      throw new InternalServerErrorException(`Cannot find lesson. ${error}`);
    }
  }

  async update(lessonId: number, dto: UpdateLessonDto) {
    try {
      await db.transaction(async (tx) => {
        await tx.update(lessons).set(dto).where(eq(lessons.id, lessonId));

        // Update videos
        if (dto.videos && dto.videos.length > 0) {
          await tx
            .update(videos)
            .set({
              title: dto.videos[0].title,
            })
            .where(eq(videos.lessonId, lessonId));
        }
      });

      return await this.findOne(lessonId);
    } catch (error) {
      throw new InternalServerErrorException(`Cannot update lesson. ${error}`);
    }
  }

  async delete(lessonId: number) {
    try {
      const lesson = await this.findOne(lessonId);

      if (!lesson) {
        throw new NotFoundException("Lesson not found");
      }

      const sectionId = lesson?.sectionId;
      const section = await db.query.courseSections.findFirst({
        where: eq(courseSections.id, sectionId),
      });

      if (!section) {
        throw new NotFoundException("Section not found");
      }

      const courseId = section?.courseId;
      await db
        .update(courses)
        .set({
          lessonsCount: sql`lessons_count - 1`,
        })
        .where(eq(courses.id, courseId));

      await db.delete(lessons).where(eq(lessons.id, lessonId));
    } catch (error) {
      throw new InternalServerErrorException(`Cannot delete lesson. ${error}`);
    }
  }

  async complete(courseId: number, lessonId: number, enrollmentId: number) {
    const [lesson, lessonError] = await attempt(
      db.query.lessons.findFirst({
        columns: {
          id: true,
        },
        where: eq(lessons.id, lessonId),
        with: {
          studentLessonCompletions: {
            where: eq(studentLessonCompletions.enrollmentId, enrollmentId),
            columns: {
              id: true,
            },
          },
          quizzes: {
            with: {
              quizSubmissions: {
                where: eq(quizSubmissions.enrollmentId, enrollmentId),
              },
            },
          },
          videos: {
            with: {
              studentVideoCompletions: {
                where: eq(studentVideoCompletions.enrollmentId, enrollmentId),
              },
            },
          },
        },
      })
    );

    if (lessonError) {
      throw lessonError;
    }

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    if (lesson.videos.length > 0) {
      const video = lesson.videos[0];
      if (video.studentVideoCompletions.length === 0) {
        throw new BadRequestException("Video lesson not completed");
      }
    }

    if (lesson.quizzes.length < 0) {
      const quiz = lesson.quizzes[0];
      if (quiz.quizSubmissions.length === 0) {
        throw new BadRequestException("Quiz lesson not completed");
      }
    }

    const [result, error] = await attempt(
      db.transaction(async (tx) => {
        const lesson = await this.findOne(lessonId);

        if (!lesson) {
          throw new NotFoundException("Lesson not found");
        }

        const enrollment = await tx.query.enrollments.findFirst({
          where: eq(enrollments.id, enrollmentId),
        });

        if (!enrollment) {
          throw new NotFoundException("Enrollment not found");
        }

        const studentLessonCompletion =
          await tx.query.studentLessonCompletions.findFirst({
            where: and(
              eq(studentLessonCompletions.lessonId, lessonId),
              eq(studentLessonCompletions.enrollmentId, enrollmentId)
            ),
          });

        if (studentLessonCompletion) {
          throw new ConflictException("Lesson already completed");
        }

        await tx.insert(studentLessonCompletions).values({
          lessonId,
          enrollmentId,
        });

        const totalLessons = await tx.query.courses.findFirst({
          where: eq(courses.id, courseId),
          columns: {
            lessonsCount: true,
          },
        });

        if (!totalLessons) {
          throw new NotFoundException("Course not found");
        }

        const completedLessons = await tx
          .select({
            count: count(studentLessonCompletions.lessonId),
          })
          .from(studentLessonCompletions)
          .where(eq(studentLessonCompletions.enrollmentId, enrollmentId));

        console.log(completedLessons[0].count);
        console.log(totalLessons.lessonsCount);

        const progress = Math.round(
          ((completedLessons[0].count || 0) / totalLessons.lessonsCount) * 100
        );
        console.log(progress);

        await tx
          .update(enrollments)
          .set({ progress })
          .where(eq(enrollments.id, enrollmentId));

        return { message: "Lesson completed" };
      })
    );

    if (error) {
      throw error;
    }

    return result;
  }

  async checkIfCompleted(lessonId: number, enrollmentId: number) {
    const [result, error] = await attempt(
      db.query.studentLessonCompletions.findFirst({
        where: and(
          eq(studentLessonCompletions.lessonId, lessonId),
          eq(studentLessonCompletions.enrollmentId, enrollmentId)
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

  async checkPreviousLessonCompleted(lessonId: number, enrollmentId: number) {
    const [currentLesson, currentLessonError] = await attempt(
      db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        columns: { id: true, sectionId: true, orderIndex: true },
      })
    );

    if (currentLessonError) {
      throw currentLessonError;
    }

    if (!currentLesson) {
      throw new NotFoundException("Lesson not found");
    }

    const [lessonsList, lessonsListError] = await attempt(
      db.query.lessons.findMany({
        where: eq(lessons.sectionId, currentLesson.sectionId),
        orderBy: [asc(lessons.orderIndex)],
        columns: { id: true, orderIndex: true },
      })
    );
    console.log("lessonsList", lessonsList);

    if (lessonsListError) {
      throw lessonsListError;
    }

    const previousLesson = lessonsList.find(
      (l) => l.orderIndex === currentLesson.orderIndex - 1
    );

    if (!previousLesson) {
      return { completed: true };
    }

    const [previousLessonCompletion, previousLessonCompletionError] =
      await attempt(
        db.query.studentLessonCompletions.findFirst({
          where: and(
            eq(studentLessonCompletions.lessonId, previousLesson.id),
            eq(studentLessonCompletions.enrollmentId, enrollmentId)
          ),
          columns: { id: true },
        })
      );
    console.log("previousLessonCompletion", previousLessonCompletion);

    if (previousLessonCompletionError) {
      throw new InternalServerErrorException(
        "Error checking previous lesson completion"
      );
    }

    if (!previousLessonCompletion) {
      return { completed: false };
    }

    return {
      completed: !!previousLessonCompletion,
    };
  }
}
