import {
  db,
  enrollments,
  lessons,
  quizSubmissions,
  studentLessonCompletions,
  studentVideoCompletions,
  videos,
} from "@lms-saas/shared-lib";
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { attempt } from "@/utils/error-handling";

@Injectable()
export class VideosService {
  async create(
    lessonId: number,
    data: {
      manifestKey: string;
      segmentsKey: string;
      title: string;
    }
  ) {
    try {
      const [video] = await db
        .insert(videos)
        .values({
          lessonId,
          title: data.title,
          manifestKey: data.manifestKey,
          segmentsKey: data.segmentsKey,
        })
        .returning({
          title: videos.title,
          manifestKey: videos.manifestKey,
          segmentsKey: videos.segmentsKey,
          id: videos.id,
        });

      return video;
    } catch (error) {
      throw new InternalServerErrorException("Failed to create video");
    }
  }

  async delete(id: string) {
    try {
      await db.delete(videos).where(eq(videos.id, id));
    } catch (error) {
      throw new InternalServerErrorException(`Cannot remove video. ${error}`);
    }
  }

  async getVideo(id: string) {
    try {
      return db.select().from(videos).where(eq(videos.id, id));
    } catch (error) {
      throw new InternalServerErrorException(`Cannot get video. ${error}`);
    }
  }

  async completeVideo(videoId: string, enrollmentId: number) {
    const [, error] = await attempt(
      db.transaction(async (tx) => {
        const [video] = await this.getVideo(videoId);
        if (!video) throw new NotFoundException("Video not found");

        const enrollment = await tx.query.enrollments.findFirst({
          where: eq(enrollments.id, enrollmentId),
        });
        if (!enrollment) throw new NotFoundException("Enrollment not found");

        const videoCompletion =
          await tx.query.studentVideoCompletions.findFirst({
            where: and(
              eq(studentVideoCompletions.enrollmentId, enrollmentId),
              eq(studentVideoCompletions.videoId, videoId)
            ),
          });
        if (videoCompletion)
          throw new ConflictException("Already completed this video");

        await tx.insert(studentVideoCompletions).values({
          enrollmentId,
          videoId,
        });

        const lessonId = video.lessonId;
        // Get lesson with quizzes and student quiz completion
        const lesson = await tx.query.lessons.findFirst({
          where: eq(lessons.id, lessonId),
          columns: {
            id: true,
          },
          with: {
            quizzes: {
              columns: {
                id: true,
              },
              with: {
                quizSubmissions: {
                  columns: {
                    id: true,
                  },
                  where: eq(quizSubmissions.enrollmentId, enrollmentId),
                },
              },
            },
          },
        });

        if (!lesson) throw new NotFoundException("Lesson not found");

        // Break if lesson has quizzes and student has not completed any of them
        if (
          lesson.quizzes.length > 0 &&
          lesson.quizzes.some((quiz) => quiz.quizSubmissions.length === 0)
        ) {
          return;
        }

        const completion = await tx.query.studentLessonCompletions.findFirst({
          where: and(
            eq(studentLessonCompletions.enrollmentId, enrollmentId),
            eq(studentLessonCompletions.lessonId, lessonId)
          ),
        });

        if (!completion) {
          await tx.insert(studentLessonCompletions).values({
            enrollmentId,
            lessonId,
          });
        }
      })
    );

    if (error) {
      throw error;
    }
  }

  async checkIfCompleted(videoId: string, enrollmentId: number) {
    const [result, error] = await attempt(
      db.query.studentVideoCompletions.findFirst({
        where: and(
          eq(studentVideoCompletions.videoId, videoId),
          eq(studentVideoCompletions.enrollmentId, enrollmentId)
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
}
