import {
  CourseEditDto,
  CreateCourseDto,
  CreateCourseSectionDto,
  courseSections,
  courses,
  db,
  enrollments,
  lessons,
  studentLessonCompletions,
  students,
  teachers,
  UpdateCourseSectionDto,
  users,
} from "@lms-saas/shared-lib";
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { Role } from "@/auth/types/roles";
import { attempt } from "@/utils/error-handling";

type WithClause = {
  courseSections?: {
    orderBy?: any;
    columns: { id: true; title: true; orderIndex: true };
    with: {
      lessons: {
        orderBy?: any;
        columns: { sectionId: false };
        with: {
          videos: { columns: { id: true } };
          quizzes: { columns: { id: true } };
        };
      };
    };
  };
  courseCodes?: {
    columns: any;
  };
  enrollments?: {
    columns: { id: true; progress: true; enrolledAt: true };
    where: any;
    with: {
      studentLessonCompletions: {
        columns: { id: true };
      };
    };
  };
  teacher?: {
    columns: { name: true };
  };
};

@Injectable()
export class CoursesService {
  async create(dto: CreateCourseDto, userId: string) {
    const [teacher, teacherError] = await attempt(
      db.select().from(teachers).where(eq(teachers.authUserId, userId))
    );
    if (teacherError)
      throw new InternalServerErrorException("Error fetching teacher");
    if (!teacher) throw new NotFoundException("Teacher not found");
    const teacherId = teacher[0].teacherId;
    await db.insert(courses).values({ price: "0.00", ...dto, teacherId });
  }

  async getByTeacherId(
    userId: string,
    role: Role,
    offset: number = NaN,
    limit: number = NaN,
    withTeacher: boolean = false,
    published: boolean = false,
    withEnrollments?: boolean
  ) {
    console.log("userId", userId);
    console.log("role", role);
    console.log("offset", offset);
    console.log("limit", limit);
    console.log("withTeacher", withTeacher);
    console.log("published", published);
    console.log("withEnrollments", withEnrollments);
    const [userRes, userError] = await attempt(
      db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .leftJoin(teachers, eq(users.id, teachers.authUserId))
        .leftJoin(students, eq(users.id, students.authUserId))
    );

    const user = userRes?.[0];

    if (userError)
      throw new InternalServerErrorException("Error fetching user");
    if (!user) throw new NotFoundException("User not found");

    const withClause: WithClause = {};

    if (withTeacher) {
      withClause.teacher = {
        columns: { name: true },
      };
    }

    if (withEnrollments && role === "student" && user.students?.id) {
      withClause.enrollments = {
        columns: { id: true, progress: true, enrolledAt: true },
        where: eq(enrollments.studentId, user.students?.id),
        with: {
          studentLessonCompletions: {
            columns: { id: true },
          },
        },
      };
    }

    // If the user is a teacher, use the teacherId from the user.teacher object.
    // If the user is a student, use the teacherId from the user.student object.
    const teacherId =
      role === "teacher" ? user.teachers?.teacherId : user.students?.teacherId;
    console.log("teacherId", teacherId);
    if (!teacherId) throw new NotFoundException("User not found");
    let res;
    if (!offset && !limit)
      res = await db.query.courses.findMany({
        where: and(
          eq(courses.teacherId, teacherId),
          eq(courses.published, published)
        ),
        orderBy: [desc(courses.createdAt)],
        columns: {
          createdAt: false,
          updatedAt: false,
        },
        with: withClause,
      });
    else {
      res = await db.query.courses.findMany({
        where: and(
          eq(courses.teacherId, teacherId),
          eq(courses.published, published)
        ),
        orderBy: [desc(courses.createdAt)],
        columns: {
          teacherId: false,
          createdAt: false,
          updatedAt: false,
        },
        with: withClause,
        limit,
        offset,
      });
    }

    console.log("courses", res);
    let myEnrollment: {
      id: number;
      progress: number;
      enrolledAt: Date | null;
      courseId: number;
    }[] = [];
    if (role === "student" && user.students?.id) {
      myEnrollment = await db.query.enrollments.findMany({
        where: and(
          eq(enrollments.studentId, user.students?.id),
          inArray(
            enrollments.courseId,
            res.map((r) => r.id)
          )
        ),
        columns: {
          id: true,
          progress: true,
          enrolledAt: true,
          courseId: true,
        },
      });
    }

    const coursesCount = (
      await db
        .select({ count: count() })
        .from(courses)
        .where(
          and(
            eq(courses.teacherId, teacherId),
            eq(courses.published, published)
          )
        )
    )[0].count;

    const studentsCount = await db
      .select({ count: count(enrollments.id), courseId: enrollments.courseId })
      .from(enrollments)
      .groupBy(enrollments.courseId)
      .where(
        inArray(
          enrollments.courseId,
          res.map((r) => r.id)
        )
      );

    const coursesRes = res.map((r) => {
      const course = studentsCount.find((s) => s.courseId === r.id);
      return {
        ...r,
        studentsCount: course?.count || 0,
        myEnrollment: [myEnrollment.find((m) => m.courseId === r.id) || null],
      };
    });

    return {
      courses: coursesRes,
      count: coursesCount,
    };
  }

  async update(courseId: number, input: CourseEditDto) {
    await db.update(courses).set(input).where(eq(courses.id, courseId));
  }

  async getOne(
    courseId: number,
    studentId?: number,
    withSections = false,
    withEnrollments = false,
    withCourseCodes = false
  ) {
    const withClause: WithClause = {};

    if (withSections) {
      withClause.courseSections = {
        orderBy: [courseSections.orderIndex],
        columns: {
          id: true,
          title: true,
          orderIndex: true,
        },
        with: {
          lessons: {
            orderBy: [lessons.orderIndex],
            columns: {
              sectionId: false,
            },
            with: {
              videos: {
                columns: {
                  id: true,
                },
              },
              quizzes: {
                columns: {
                  id: true,
                },
              },
            },
          },
        },
      };
    }

    if (withEnrollments && studentId) {
      withClause.enrollments = {
        columns: {
          id: true,
          progress: true,
          enrolledAt: true,
        },
        with: {
          studentLessonCompletions: {
            columns: {
              id: true,
            },
          },
        },
        where: eq(enrollments.studentId, studentId),
      };
    }

    if (withCourseCodes) {
      withClause.courseCodes = {
        columns: { id: true },
      };
    }

    const data = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        ...withClause,
      },
    });

    const [studentsCount, error] = await attempt(
      db
        .select({ count: count(enrollments.id) })
        .from(enrollments)
        .where(eq(enrollments.courseId, courseId))
    );

    if (error) {
      throw new InternalServerErrorException("Error fetching student count");
    }

    if (data) {
      data["studentsCount"] = studentsCount[0].count;
    }

    return data;
  }

  async delete(courseId: number) {
    await db.delete(courses).where(eq(courses.id, courseId));
  }

  async addSection(courseId: number, dto: CreateCourseSectionDto) {
    return await db
      .insert(courseSections)
      .values({ ...dto, courseId })
      .returning({
        id: courseSections.id,
        title: courseSections.title,
        orderIndex: courseSections.orderIndex,
      });
  }

  async getSections(courseId: number) {
    return await db.query.courseSections.findMany({
      where: eq(courseSections.courseId, courseId),
    });
  }

  async updateSection(sectionId: number, dto: UpdateCourseSectionDto) {
    await db.transaction(async (tx) => {
      // Update section
      await tx
        .update(courseSections)
        .set({
          title: dto.title,
          orderIndex: dto.orderIndex,
        })
        .where(eq(courseSections.id, sectionId));

      // Update lesson order if provided
      if (dto.lessons?.length) {
        for (const lesson of dto.lessons) {
          await tx
            .update(lessons)
            .set({
              title: lesson.title,
              orderIndex: lesson.orderIndex,
            })
            .where(eq(lessons.id, lesson.id!));
        }
      }
    });

    return await db.query.courseSections.findFirst({
      where: eq(courseSections.id, sectionId),
      with: {
        lessons: true,
      },
    });
  }

  async deleteSection(sectionId: number) {
    return await db
      .delete(courseSections)
      .where(eq(courseSections.id, sectionId));
  }

  async findSection(sectionId: number) {
    return await db.query.courseSections.findFirst({
      where: eq(courseSections.id, sectionId),
      with: {
        lessons: {
          columns: {
            id: true,
            title: true,
            orderIndex: true,
          },
          with: {
            videos: {
              columns: {
                lessonId: false,
                createdAt: false,
              },
            },
            quizzes: {
              columns: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: lessons.orderIndex,
        },
      },
    });
  }

  async getEnrolledCourses(offset: number, limit: number, studentId: number) {
    let res;
    if (!offset && !limit) {
      res = await db.query.enrollments.findMany({
        where: and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.status, "active")
        ),
        orderBy: [desc(enrollments.enrolledAt)],
        with: {
          course: {
            columns: {
              id: true,
              title: true,
              lessonsCount: true,
              description: true,
              imageUrl: true,
              price: true,
              published: true,
              teacherId: true,
            },
            with: {
              enrollments: {
                columns: {
                  id: true,
                },
              },
            },
          },
        },
        columns: {
          id: true,
          progress: true,
          enrolledAt: true,
        },
      });
    } else {
      res = await db.query.enrollments.findMany({
        where: and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.status, "active")
        ),
        orderBy: [desc(enrollments.enrolledAt)],
        offset,
        limit,
        with: {
          course: {
            columns: {
              id: true,
              title: true,
              lessonsCount: true,
              description: true,
              imageUrl: true,
              price: true,
              published: true,
              teacherId: true,
            },
            with: {
              enrollments: {
                columns: {
                  id: true,
                },
              },
            },
          },
        },
        columns: {
          id: true,
          progress: true,
          enrolledAt: true,
        },
      });
    }

    const courses = res.map((en) => {
      return {
        ...en.course,
        studentsCount: en.course.enrollments.length,
        myEnrollment: [
          {
            id: en.id,
            progress: en.progress,
            enrolledAt: en.enrolledAt,
          },
        ],
      };
    });

    const coursesCount = await db
      .select({ count: count(enrollments.id) })
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));
    console.log("res", res);

    return { courses, count: coursesCount[0].count };
  }

  async updateEnrollmentProgress(enrollmentId: number) {
    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const courseId = enrollment.courseId;

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    const lessonsResult = await db
      .select({ value: count(lessons.id) })
      .from(lessons)
      .innerJoin(courseSections, eq(lessons.sectionId, courseSections.id))
      .where(eq(courses.id, courseSections.courseId));

    const totalLessons = lessonsResult[0].value;

    if (totalLessons === 0) {
      await db
        .update(enrollments)
        .set({ progress: 0 })
        .where(eq(enrollments.id, enrollmentId));
    }

    const completedLessons = await db
      .select({ value: count(studentLessonCompletions.id) })
      .from(studentLessonCompletions)
      .where(eq(studentLessonCompletions.enrollmentId, enrollmentId));

    const completedLessonsCount = completedLessons[0].value;

    const progress = Math.round((completedLessonsCount / totalLessons) * 100);

    await db
      .update(enrollments)
      .set({ progress })
      .where(eq(enrollments.id, enrollmentId));

    return { progress };
  }
}
