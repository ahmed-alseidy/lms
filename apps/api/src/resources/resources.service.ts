import {
  courseResources,
  db,
  enrollments,
  lessonResources,
  resourceDownloads,
} from "@lms-saas/shared-lib";
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, or } from "drizzle-orm";
import { attempt } from "@/utils/error-handling";

@Injectable()
export class ResourcesService {
  // Lesson Resources
  async createLessonResource(
    lessonId: number,
    data: {
      title: string;
      fileKey: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }
  ) {
    try {
      const [resource] = await db
        .insert(lessonResources)
        .values({
          lessonId,
          title: data.title,
          fileKey: data.fileKey,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
        })
        .returning({
          id: lessonResources.id,
          title: lessonResources.title,
          fileKey: lessonResources.fileKey,
          fileName: lessonResources.fileName,
          fileType: lessonResources.fileType,
          fileSize: lessonResources.fileSize,
          createdAt: lessonResources.createdAt,
        });

      return resource;
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to create lesson resource"
      );
    }
  }

  async getLessonResources(lessonId: number) {
    try {
      return db
        .select()
        .from(lessonResources)
        .where(eq(lessonResources.lessonId, lessonId));
    } catch (error) {
      throw new InternalServerErrorException("Failed to get lesson resources");
    }
  }

  async getLessonResource(id: string) {
    try {
      const [resource] = await db
        .select()
        .from(lessonResources)
        .where(eq(lessonResources.id, id))
        .limit(1);

      return resource;
    } catch (error) {
      throw new InternalServerErrorException("Failed to get lesson resource");
    }
  }

  async deleteLessonResource(id: string) {
    try {
      await db.delete(lessonResources).where(eq(lessonResources.id, id));
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to delete lesson resource"
      );
    }
  }

  // Course Resources
  async createCourseResource(
    courseId: number,
    data: {
      title: string;
      description?: string;
      fileKey: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }
  ) {
    try {
      const [resource] = await db
        .insert(courseResources)
        .values({
          courseId,
          title: data.title,
          description: data.description,
          fileKey: data.fileKey,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
        })
        .returning({
          id: courseResources.id,
          title: courseResources.title,
          description: courseResources.description,
          fileKey: courseResources.fileKey,
          fileName: courseResources.fileName,
          fileType: courseResources.fileType,
          fileSize: courseResources.fileSize,
          createdAt: courseResources.createdAt,
        });

      return resource;
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to create course resource"
      );
    }
  }

  async getCourseResources(courseId: number) {
    try {
      return db
        .select()
        .from(courseResources)
        .where(eq(courseResources.courseId, courseId));
    } catch (error) {
      throw new InternalServerErrorException("Failed to get course resources");
    }
  }

  async getCourseResource(id: string) {
    try {
      const [resource] = await db
        .select()
        .from(courseResources)
        .where(eq(courseResources.id, id))
        .limit(1);

      return resource;
    } catch (error) {
      throw new InternalServerErrorException("Failed to get course resource");
    }
  }

  async deleteCourseResource(id: string) {
    try {
      await db.delete(courseResources).where(eq(courseResources.id, id));
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to delete course resource"
      );
    }
  }

  // Download Tracking
  async trackDownload(
    enrollmentId: number,
    resourceType: "lesson" | "course",
    lessonResourceId?: string,
    courseResourceId?: string
  ) {
    const [, error] = await attempt(
      db.transaction(async (tx) => {
        const enrollment = await tx.query.enrollments.findFirst({
          where: eq(enrollments.id, enrollmentId),
        });

        if (!enrollment) {
          throw new NotFoundException("Enrollment not found");
        }

        // Verify resource exists
        if (resourceType === "lesson" && lessonResourceId) {
          const resource = await tx.query.lessonResources.findFirst({
            where: eq(lessonResources.id, lessonResourceId),
          });
          if (!resource) {
            throw new NotFoundException("Lesson resource not found");
          }
        } else if (resourceType === "course" && courseResourceId) {
          const resource = await tx.query.courseResources.findFirst({
            where: eq(courseResources.id, courseResourceId),
          });
          if (!resource) {
            throw new NotFoundException("Course resource not found");
          }
        }

        await tx.insert(resourceDownloads).values({
          enrollmentId,
          resourceType,
          lessonResourceId: lessonResourceId || null,
          courseResourceId: courseResourceId || null,
        });
      })
    );

    if (error) {
      throw error;
    }

    return { message: "Download tracked successfully" };
  }

  async getDownloadStats(
    resourceId: string,
    resourceType: "lesson" | "course"
  ) {
    try {
      if (resourceType === "lesson") {
        return db
          .select()
          .from(resourceDownloads)
          .where(eq(resourceDownloads.lessonResourceId, resourceId));
      } else {
        return db
          .select()
          .from(resourceDownloads)
          .where(eq(resourceDownloads.courseResourceId, resourceId));
      }
    } catch (error) {
      throw new InternalServerErrorException("Failed to get download stats");
    }
  }
}
