import {
  courses,
  db,
  enrollments,
  students,
  teachers,
} from "@lms-saas/shared-lib";
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import * as dayjs from "dayjs";
import { attempt } from "@/utils/error-handling";
import "dayjs/locale/ar";
import {
  and,
  avg,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  lt,
  sql,
  sum,
} from "drizzle-orm";

@Injectable()
export class AnalyticsService {
  async getStudents(userId: string, page: number = 1, limit: number = 10) {
    const [teacher, teacherError] = await attempt(
      db.query.teachers.findFirst({
        where: eq(teachers.authUserId, userId),
        columns: {
          teacherId: true,
        },
      })
    );
    if (teacherError || !teacher) {
      throw new InternalServerErrorException("Cannot process teacher");
    }

    const [studentsResult, studentsError] = await attempt(
      db.query.students.findMany({
        where: eq(students.teacherId, teacher.teacherId),
        orderBy: desc(students.createdAt),
        offset: (page - 1) * limit,
        limit,
        columns: {
          hashedRefreshToken: false,
          authUserId: false,
          updatedAt: false,
          teacherId: false,
        },
      })
    );
    if (studentsError || !studentsResult) {
      throw new InternalServerErrorException("Cannot process students");
    }
    return { students: studentsResult };
  }
  private async getTeacher(userId: string) {
    const [teacher, teacherError] = await attempt(
      db.query.teachers.findFirst({
        where: eq(teachers.authUserId, userId),
        columns: {
          teacherId: true,
        },
      })
    );
    if (teacherError) {
      throw new InternalServerErrorException("Cannot process teacher");
    }
    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }
    return teacher;
  }

  async getOverview(userId: string) {
    const teacher = await this.getTeacher(userId);

    let [studentCountResult, studentsError] = await attempt(
      db
        .select({ count: count(students.id) })
        .from(students)
        .where(eq(students.teacherId, teacher.teacherId))
    );
    if (studentsError || !studentCountResult) {
      studentCountResult = [{ count: 0 }];
    }

    let [courseCountResult, coursesError] = await attempt(
      db
        .select({ count: count(courses.id) })
        .from(courses)
        .where(eq(courses.teacherId, teacher.teacherId))
    );
    if (coursesError || !courseCountResult) {
      courseCountResult = [{ count: 0 }];
    }

    let [totalRevenue, revenueError] = await attempt(
      db
        .select({ sum: sum(courses.price) })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(
          and(
            eq(courses.teacherId, teacher.teacherId),
            eq(enrollments.status, "active")
          )
        )
    );
    if (revenueError || !totalRevenue) {
      totalRevenue = [{ sum: "0.00" }];
    }

    let [avgCompletionRate, avgCompletionRateError] = await attempt(
      db
        .select({ avg: avg(enrollments.progress) })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(courses.teacherId, teacher.teacherId))
    );
    if (avgCompletionRateError || !avgCompletionRate) {
      avgCompletionRate = [{ avg: "0.00" }];
    }

    let [studentCountBeforeMonth, studentCountBeforeMonthError] = await attempt(
      db
        .select({ count: count(students.id) })
        .from(students)
        .where(
          and(
            eq(students.teacherId, teacher.teacherId),
            lt(students.createdAt, dayjs().subtract(1, "month").toDate())
          )
        )
    );
    if (studentCountBeforeMonthError || !studentCountBeforeMonth) {
      studentCountBeforeMonth = [{ count: 0 }];
    }
    const studentGrowth =
      ((studentCountResult[0].count - studentCountBeforeMonth[0].count) /
        (studentCountBeforeMonth[0].count || 1)) *
      100;

    let [beforeMonthRevenue] = await attempt(
      db
        .select({ sum: sum(courses.price) })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(
          and(
            eq(courses.teacherId, teacher.teacherId),
            gte(
              enrollments.enrolledAt,
              dayjs().subtract(1, "month").endOf("month").toDate()
            ),
            lt(enrollments.enrolledAt, dayjs().startOf("month").toDate())
          )
        )
    );
    let [currentMonthRevenue] = await attempt(
      db
        .select({ sum: sum(courses.price) })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(
          and(
            eq(courses.teacherId, teacher.teacherId),
            eq(enrollments.status, "active"),
            gte(enrollments.enrolledAt, dayjs().startOf("month").toDate()),
            lt(enrollments.enrolledAt, dayjs().endOf("month").toDate())
          )
        )
    );

    // delta / previous month revenue
    const revenueGrowth =
      (((Number(currentMonthRevenue?.[0]?.sum) || 0) -
        (Number(beforeMonthRevenue?.[0]?.sum) || 0)) /
        (Number(beforeMonthRevenue?.[0]?.sum) || 1)) *
      100;

    const [courseCountBeforeMonth] = await attempt(
      db
        .select({ count: count(courses.id) })
        .from(courses)
        .where(
          and(
            eq(courses.teacherId, teacher.teacherId),
            gte(
              courses.createdAt,
              dayjs().subtract(1, "month").startOf("month").toDate()
            ),
            lt(
              courses.createdAt,
              dayjs().subtract(1, "month").endOf("month").toDate()
            )
          )
        )
    );
    const courseGrowth =
      ((courseCountResult[0].count -
        (courseCountBeforeMonth?.[0]?.count || 0)) /
        (courseCountBeforeMonth?.[0]?.count || 1)) *
      100;

    let [completionGrowthBeforeMonth, completionGrowthBeforeMonthError] =
      await attempt(
        db
          .select({ avg: avg(enrollments.progress) })
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .where(
            and(
              eq(courses.teacherId, teacher.teacherId),
              gte(
                enrollments.completedAt,
                dayjs().subtract(1, "month").toDate()
              )
            )
          )
      );

    if (completionGrowthBeforeMonthError || !completionGrowthBeforeMonth) {
      completionGrowthBeforeMonth = [{ avg: "0.00" }];
    }

    const completionGrowth =
      (((Number(completionGrowthBeforeMonth?.[0]?.avg) || 0) -
        (Number(avgCompletionRate?.[0]?.avg) || 0)) /
        (Number(avgCompletionRate?.[0]?.avg) || 1)) *
      100;

    return {
      overview: {
        totalStudents: studentCountResult[0].count,
        totalCourses: courseCountResult[0].count,
        totalRevenue: totalRevenue[0].sum || "0.00",
        avgCompletionRate: avgCompletionRate?.[0]?.avg || "0.00",
        studentGrowth,
        revenueGrowth,
        courseGrowth,
        completionGrowth,
      },
    };
  }

  async getMonthlyData(userId: string, period: number = 6) {
    const teacher = await this.getTeacher(userId);
    let startDate = dayjs().startOf("month");
    let endDate = dayjs().endOf("month");
    let data: {
      month: string;
      students: number;
      revenue: string;
      completions: number;
      enrollments: number;
      activeUsers: number;
    }[] = [];
    for (let n = 0; n < period; n++) {
      const [studentsCount, studentCountError] = await attempt(
        db
          .select({ count: count(students.id) })
          .from(students)
          .where(
            and(
              gte(students.createdAt, startDate.toDate()),
              lt(students.createdAt, endDate.toDate()),
              eq(students.teacherId, teacher.teacherId)
            )
          )
      );
      if (studentCountError || !studentsCount) {
        throw new InternalServerErrorException("Cannot process students count");
      }

      const [revenue, revenueError] = await attempt(
        db
          .select({ sum: sum(courses.price) })
          .from(enrollments)
          .innerJoin(courses, eq(courses.id, enrollments.courseId))
          .where(
            and(
              eq(courses.teacherId, teacher.teacherId),
              gte(enrollments.enrolledAt, startDate.toDate()),
              lt(enrollments.enrolledAt, endDate.toDate())
            )
          )
      );
      if (revenueError || !revenue) {
        throw new InternalServerErrorException("Cannot process revenue");
      }

      const [completions, completionsError] = await attempt(
        db
          .select({ count: count(enrollments.id) })
          .from(enrollments)
          .innerJoin(courses, eq(courses.id, enrollments.courseId))
          .where(
            and(
              eq(enrollments.progress, 1),
              eq(enrollments.status, "active"),
              gte(enrollments.completedAt, startDate.toDate()),
              lt(enrollments.completedAt, endDate.toDate())
            )
          )
      );
      if (completionsError || !completions) {
        throw new InternalServerErrorException("Cannot process completions");
      }

      const [enrollmentsCount, enrollmentsCountError] = await attempt(
        db
          .select({ count: count(enrollments.id) })
          .from(enrollments)
          .innerJoin(courses, eq(courses.id, enrollments.courseId))
          .where(
            and(
              eq(courses.teacherId, teacher.teacherId),
              gte(enrollments.enrolledAt, startDate.toDate()),
              lt(enrollments.enrolledAt, endDate.toDate())
            )
          )
      );
      if (enrollmentsCountError || !enrollmentsCount) {
        throw new InternalServerErrorException("Cannot process enrollments");
      }

      const [activeUsers, activeUsersError] = await attempt(
        db
          .select({ count: count(enrollments.id) })
          .from(enrollments)
          .innerJoin(courses, eq(courses.id, enrollments.courseId))
          .where(
            and(
              eq(courses.teacherId, teacher.teacherId),
              gte(enrollments.enrolledAt, startDate.toDate()),
              lt(enrollments.enrolledAt, endDate.toDate()),
              eq(enrollments.status, "active")
            )
          )
      );
      if (activeUsersError || !activeUsers) {
        throw new InternalServerErrorException("Cannot process active users");
      }

      data = [
        {
          month: dayjs(startDate).format("MMM"),
          students: studentsCount[0].count,
          revenue: revenue[0].sum || "0.00",
          completions: completions[0].count,
          enrollments: enrollmentsCount[0].count,
          activeUsers: activeUsers[0].count,
        },
        ...data,
      ];

      startDate = dayjs(startDate).subtract(1, "month");
      endDate = dayjs(endDate).subtract(1, "month");
    }
    return { monthlyData: data };
  }

  async getTopCourses(userId: string, limit: number = 5) {
    const teacher = await this.getTeacher(userId);
    const [topCourses, topCoursesError] = await attempt(
      db
        .select({
          courseId: courses.id,
          courseName: courses.title,
          students: count(enrollments.id),
          revenue: sum(courses.price),
          // TODO: add rating,
          completionRate: avg(enrollments.progress),
          imageUrl: courses.imageUrl,
          createdAt: courses.createdAt,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(courses.teacherId, teacher.teacherId))
        .groupBy(courses.id)
        .orderBy(desc(count(enrollments.id)), desc(courses.createdAt))
        .limit(limit)
    );
    if (topCoursesError || !topCourses) {
      throw new InternalServerErrorException("Cannot process top courses");
    }
    return { topCourses };
  }

  async getRecentActivities(userId: string, limit: number = 5) {
    const teacher = await this.getTeacher(userId);
    const [recentEnrollments, recentEnrollmentsError] = await attempt(
      db
        .select({
          id: enrollments.id,
          type: sql`'enrollment'`.as("type"),
          studentId: students.id,
          studentName: students.name,
          studentEmail: students.email,
          courseId: courses.id,
          courseName: courses.title,
          courseImageUrl: courses.imageUrl,
          timestamp: enrollments.enrolledAt,
          metadata: courses.price,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(
          and(
            eq(courses.teacherId, teacher.teacherId),
            eq(enrollments.status, "active")
          )
        )
        .orderBy(desc(enrollments.enrolledAt))
        .limit(limit)
    );

    const [recentCompletions, recentCompletionsError] = await attempt(
      db
        .select({
          id: enrollments.id,
          type: sql`'completion'`.as("type"),
          studentId: students.id,
          studentName: students.name,
          studentEmail: students.email,
          courseId: courses.id,
          courseName: courses.title,
          courseImageUrl: courses.imageUrl,
          timestamp: enrollments.completedAt,
          metadata: enrollments.progress,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(
          and(
            eq(courses.teacherId, teacher.teacherId),
            eq(enrollments.progress, 1),
            isNotNull(enrollments.completedAt)
          )
        )
        .orderBy(desc(enrollments.completedAt))
        .limit(limit)
    );
    if (recentCompletionsError || recentEnrollmentsError) {
      throw new InternalServerErrorException(
        "Cannot process recent activities"
      );
    }
    const allActivities = [...recentEnrollments, ...recentCompletions].sort(
      (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
    );
    const formattedActivities = allActivities.slice(0, limit).map((a) => ({
      id: a.id,
      type: a.type,
      student: {
        id: a.studentId,
        name: a.studentName,
        email: a.studentEmail,
      },
      course: {
        id: a.courseId,
        title: a.courseName,
        imageUrl: a.courseImageUrl,
      },
      timestamp: a.timestamp,
      timeAgo: a.timestamp && this.getTimeAgo(a.timestamp),
      // metadata: a.metadata,
    }));
    return { recentActivities: formattedActivities };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  async getRevenueBreakdown(userId: string, months: number = 6) {
    const teacher = await this.getTeacher(userId);
    const [courseSales, courseSalesError] = await attempt(
      db
        .select({
          amount: sum(courses.price),
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(courses.teacherId, teacher.teacherId))
    );
    if (courseSalesError || !courseSales) {
      throw new InternalServerErrorException("Cannot process course sales");
    }
    const byType = [
      {
        type: "course_sales",
        amount: courseSales[0].amount,
      },
    ];

    let byPeriod: { month: string; revenue: string }[] = [];
    let current = dayjs().startOf("month");
    for (let i = 0; i < months; i++) {
      const start = current.subtract(i, "month").startOf("month").toDate();
      const end = current.subtract(i, "month").endOf("month").toDate();

      const [revenue, revenueError] = await attempt(
        db
          .select({ sum: sum(courses.price) })
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .where(
            and(
              eq(courses.teacherId, teacher.teacherId),
              gte(enrollments.enrolledAt, start),
              lt(enrollments.enrolledAt, end),
              eq(enrollments.status, "active")
            )
          )
      );
      if (revenueError) {
        throw new InternalServerErrorException(
          "Cannot process monthly revenue"
        );
      }
      byPeriod = [
        {
          month: dayjs(start).format("MMM"),
          revenue: revenue?.[0]?.sum || "0.00",
        },
        ...byPeriod,
      ];
    }
    return {
      revenueBreakdown: {
        byType,
        byPeriod,
      },
    };
  }
}
