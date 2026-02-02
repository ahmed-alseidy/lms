import {
  SelectCourse,
  SelectCourseSection,
} from "@lms-saas/shared-lib/db/schema";
import {
  CourseEditDto,
  CreateCourseDto,
  CreateCourseSectionDto,
  CreateLessonDto,
  UpdateCourseSectionDto,
  UpdateLessonDto,
} from "@lms-saas/shared-lib/dtos";
import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";
import { Quiz } from "./quizzes";
import { Video } from "./videos";

const baseUrl = `${BACKEND_URL}/courses`;

export type CourseWithEnrollments = SelectCourse & {
  myEnrollment?: {
    id: number;
    progress: number;
    enrolledAt: Date;
  }[];
  courseCodes: {
    id: number;
  }[];
  studentsCount: number;
  enrollments: {
    id: number;
    progress: number;
    enrolledAt: Date;
  }[];
};

export type CourseWithSectionsAndEnrollments = SelectCourse & {
  courseCodes: {
    id: number;
  }[];
  courseSections: {
    id: number;
    title: string;
    orderIndex: number;
    lessons: {
      id: number;
      title: string;
      orderIndex: number;
      videos: Video[];
      quizzes: Quiz[];
    }[];
  }[];
  enrollments?: {
    id: number;
    progress: number;
    enrolledAt: Date;
    studentLessonCompletions: {
      id: number;
    }[];
  }[];
  studentsCount: number;
};

export async function getCoursesByTeacherId(
  published: boolean,
  page?: number,
  limit?: number,
  withTeacher = false,
  withEnrollments = false
) {
  let url = `${baseUrl}/by-teacher-id?with-teacher=${withTeacher}&published=${published}&with-enrollments=${withEnrollments}`;
  if (page && limit) {
    url += `&page=${page}&limit=${limit}`;
  }
  const response = await authFetch<{
    courses: CourseWithEnrollments[];
    count: number;
  }>(url);
  // Some endpoints return `{courses, count}` directly, while the client types also
  // support an `OkResponse` wrapper. Normalize here so callers always get `{courses, count}`.
  const payload = response.data as unknown as
    | { courses: CourseWithEnrollments[]; count: number }
    | { data: { courses: CourseWithEnrollments[]; count: number } };
  return "data" in payload ? payload.data : payload;
}

export async function createCourse(input: CreateCourseDto) {
  await authFetch<void>(baseUrl, { method: "POST", data: input });
}

export async function getCourse(
  id: number,
  withSections = false,
  withEnrollments = false,
  withCourseCodes = false
) {
  return authFetch<CourseWithSectionsAndEnrollments>(
    `${baseUrl}/${id}?with-enrollments=${withEnrollments}&with-sections=${withSections}&with-course-codes=${withCourseCodes}`,
    {
      method: "GET",
    }
  );
}

export async function updateCourse(id: number, input: CourseEditDto) {
  await authFetch<void>(`${baseUrl}/${id}`, { method: "PUT", data: input });
}

export async function deleteCourse(id: number) {
  return authFetch(`${baseUrl}/${id}`, { method: "DELETE" });
}

export type CourseSection = {
  id: number;
  title: string;
  orderIndex: number;
  courseId: number;
  lessons: Lesson[];
};

export async function createCourseSection(
  courseId: number,
  input: CreateCourseSectionDto
) {
  return authFetch<Omit<CourseSection, "courseId">[]>(
    `${baseUrl}/${courseId}/sections`,
    {
      method: "POST",
      data: input,
    }
  );
}

export async function updateCourseSection(
  courseId: number,
  sectionId: number,
  input: UpdateCourseSectionDto
) {
  return authFetch<void>(`${baseUrl}/${courseId}/sections/${sectionId}`, {
    method: "PUT",
    data: input,
  });
}

export async function getCourseSections(courseId: number) {
  return authFetch<SelectCourseSection[]>(`${baseUrl}/${courseId}/sections`, {
    method: "GET",
  });
}

export async function findCourseSection(courseId: number, sectionId: number) {
  return authFetch<CourseSection>(
    `${baseUrl}/${courseId}/sections/${sectionId}`,
    { method: "GET" }
  );
}

export async function deleteCourseSection(courseId: number, sectionId: number) {
  return authFetch<void>(`${baseUrl}/${courseId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export async function uploadCoverImage(courseId: number, file: File) {
  const formData = new FormData();
  formData.append("coverImage", file);

  await authFetch<void>(`${baseUrl}/${courseId}/upload-cover-image`, {
    method: "PUT",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// Lessons
export interface Lesson {
  id: number;
  title: string;
  orderIndex: number;
  videos: Video[];
  quizzes: Quiz[];
  description: string;
}

export async function createLesson(
  courseId: number,
  sectionId: number,
  input: CreateLessonDto
) {
  return authFetch<{ id: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons`,
    {
      method: "POST",
      data: input,
    }
  );
}

export async function updateLesson(
  courseId: number,
  sectionId: number,
  lessonId: number,
  input: UpdateLessonDto
) {
  return authFetch<{ id: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
    {
      method: "PUT",
      data: input,
    }
  );
}

export async function findLesson(
  courseId: number,
  sectionId: number,
  lessonId: number
) {
  return authFetch<Lesson>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
    { method: "GET" }
  );
}

export async function deleteLesson(
  courseId: number,
  sectionId: number,
  lessonId: number
) {
  return authFetch<{ id: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
    {
      method: "DELETE",
    }
  );
}

export async function getEnrolledCourses(page: number, limit: number) {
  return authFetch<{ courses: CourseWithEnrollments[]; count: number }>(
    `${baseUrl}/enrolled?page=${page}&limit=${limit}`,
    {
      method: "GET",
    }
  );
}

export async function completeLesson(
  courseId: number,
  sectionId: number,
  lessonId: number,
  enrollmentId: number
) {
  return authFetch<{ progress: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}/complete`,
    {
      method: "POST",
      data: { enrollmentId },
    }
  );
}

export async function checkIfLessonCompleted(
  courseId: number,
  sectionId: number,
  lessonId: number,
  enrollmentId: number
) {
  return authFetch<{ completed: boolean }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}/completed?enrollmentId=${enrollmentId}`,
    { method: "GET" }
  );
}

export async function checkPreviousSectionCompleted(
  courseId: number,
  sectionId: number,
  enrollmentId: number
) {
  return authFetch<{ completed: boolean }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/previous-completed?enrollmentId=${enrollmentId}`,
    { method: "GET" }
  );
}

export async function checkPreviousLessonCompleted(
  courseId: number,
  sectionId: number,
  lessonId: number,
  enrollmentId: number
) {
  return authFetch<{ completed: boolean }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}/previous-completed?enrollmentId=${enrollmentId}`,
    { method: "GET" }
  );
}
