import { courseCodes, courses, db, enrollments } from "@lms-saas/shared-lib";
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

@Injectable()
export class CourseCodesService {
  async generateCodes(courseId: number, quantity: number, teacherId: number) {
    // Verify course ownership
    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), eq(courses.teacherId, teacherId)),
    });

    if (!course) {
      throw new ForbiddenException("Course not found");
    }

    const codes = Array.from({ length: quantity }, () => ({
      courseId,
      code: nanoid(16),
      isUsed: false,
    }));

    await db.insert(courseCodes).values(codes);

    return { message: `Generated ${quantity} codes successfully` };
  }

  async validateAndUseCode(code: string, courseId: number, studentId: number) {
    const courseCode = await db.query.courseCodes.findFirst({
      where: and(
        eq(courseCodes.code, code),
        eq(courseCodes.courseId, courseId),
        eq(courseCodes.isUsed, false)
      ),
    });

    if (!courseCode) {
      throw new NotFoundException("Invalid or already used code");
    }

    // Mark code as used and assign to student
    await db
      .update(courseCodes)
      .set({
        isUsed: true,
        assignedTo: studentId,
        usedAt: new Date(),
      })
      .where(eq(courseCodes.id, courseCode.id));

    await db.insert(enrollments).values({
      courseId,
      studentId,
      status: "active",
    });

    return { message: "Successfully enrolled in the course" };
  }

  async getCourseCodes(courseId: number, teacherId: number) {
    // Verify course ownership
    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), eq(courses.teacherId, teacherId)),
    });

    if (!course) {
      throw new ForbiddenException("Course not found");
    }

    return db.query.courseCodes.findMany({
      where: eq(courseCodes.courseId, courseId),
      with: {
        student: {
          columns: {
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
