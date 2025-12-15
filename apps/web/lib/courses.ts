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
  return response.data;
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

export function deleteCourse(id: number) {
  return authFetch(`${baseUrl}/${id}`, { method: "DELETE" });
}

export type CourseSection = {
  id: number;
  title: string;
  orderIndex: number;
  courseId: number;
  lessons: Lesson[];
};

export const createCourseSection = (
  courseId: number,
  input: CreateCourseSectionDto
) => {
  return authFetch<Omit<CourseSection, "courseId">[]>(
    `${baseUrl}/${courseId}/sections`,
    {
      method: "POST",
      data: input,
    }
  );
};

export const updateCourseSection = (
  courseId: number,
  sectionId: number,
  input: UpdateCourseSectionDto
) => {
  return authFetch<void>(`${baseUrl}/${courseId}/sections/${sectionId}`, {
    method: "PUT",
    data: input,
  });
};

export const getCourseSections = (courseId: number) => {
  return authFetch<SelectCourseSection[]>(`${baseUrl}/${courseId}/sections`, {
    method: "GET",
  });
};

export const findCourseSection = (courseId: number, sectionId: number) => {
  return authFetch<CourseSection>(
    `${baseUrl}/${courseId}/sections/${sectionId}`,
    { method: "GET" }
  );
};

export const deleteCourseSection = (courseId: number, sectionId: number) => {
  return authFetch<void>(`${baseUrl}/${courseId}/sections/${sectionId}`, {
    method: "DELETE",
  });
};

export const uploadCoverImage = async (courseId: number, file: File) => {
  const formData = new FormData();
  formData.append("coverImage", file);

  await authFetch<void>(`${baseUrl}/${courseId}/upload-cover-image`, {
    method: "PUT",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Lessons
export interface Lesson {
  id: number;
  title: string;
  orderIndex: number;
  videos: Video[];
  quizzes: Quiz[];
  description: string;
}

export const createLesson = (
  courseId: number,
  sectionId: number,
  input: CreateLessonDto
) => {
  return authFetch<{ id: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons`,
    {
      method: "POST",
      data: input,
    }
  );
};

export const updateLesson = (
  courseId: number,
  sectionId: number,
  lessonId: number,
  input: UpdateLessonDto
) => {
  return authFetch<{ id: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
    {
      method: "PUT",
      data: input,
    }
  );
};

export const findLesson = (
  courseId: number,
  sectionId: number,
  lessonId: number
) => {
  return authFetch<Lesson>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
    { method: "GET" }
  );
};

export const deleteLesson = (
  courseId: number,
  sectionId: number,
  lessonId: number
) => {
  return authFetch<{ id: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
    {
      method: "DELETE",
    }
  );
};

export const getEnrolledCourses = async () => {
  return authFetch<CourseWithEnrollments[]>(`${baseUrl}/enrolled`, {
    method: "GET",
  });
};

export const completeLesson = async (
  courseId: number,
  sectionId: number,
  lessonId: number,
  enrollmentId: number
) => {
  return authFetch<{ progress: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}/complete`,
    {
      method: "POST",
      data: { enrollmentId },
    }
  );
};

export const checkIfLessonCompleted = async (
  courseId: number,
  sectionId: number,
  lessonId: number,
  enrollmentId: number
) => {
  return authFetch<{ completed: boolean }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}/completed?enrollmentId=${enrollmentId}`,
    { method: "GET" }
  );
};
