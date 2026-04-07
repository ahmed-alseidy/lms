import {
  SelectCourse,
  SelectCourseSection,
} from "@lms-saas/shared-lib/db/schema";
import { apiClient } from "./api-client";

const baseUrl = "/courses";

type Quiz = {
  id: number;
  title: string;
};

type Video = {
  id: number;
  title: string;
};

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

  const { data } = await apiClient.get<{
    courses: CourseWithEnrollments[];
    count: number;
  }>(url);

  const payload = data as
    | { courses: CourseWithEnrollments[]; count: number }
    | { data: { courses: CourseWithEnrollments[]; count: number } };
  return "data" in payload ? payload.data : payload;
}

export async function getCourse(
  id: number,
  withSections = false,
  withEnrollments = false,
  withCourseCodes = false
) {
  const { data } = await apiClient.get<CourseWithSectionsAndEnrollments>(
    `${baseUrl}/${id}?with-enrollments=${withEnrollments}&with-sections=${withSections}&with-course-codes=${withCourseCodes}`
  );
  return data;
}

export type CourseSection = {
  id: number;
  title: string;
  orderIndex: number;
  courseId: number;
  lessons: Lesson[];
};

export async function getCourseSections(courseId: number) {
  const { data } = await apiClient.get<SelectCourseSection[]>(
    `${baseUrl}/${courseId}/sections`
  );
  return data;
}

export async function findCourseSection(courseId: number, sectionId: number) {
  const { data } = await apiClient.get<CourseSection>(
    `${baseUrl}/${courseId}/sections/${sectionId}`
  );
  return data;
}

export interface Lesson {
  id: number;
  title: string;
  orderIndex: number;
  videos: Video[];
  quizzes: Quiz[];
  description: string;
}

export async function findLesson(
  courseId: number,
  sectionId: number,
  lessonId: number
) {
  const { data } = await apiClient.get<Lesson>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}`
  );
  return data;
}

export async function deleteLesson(
  courseId: number,
  sectionId: number,
  lessonId: number
) {
  const { data } = await apiClient.delete<{ id: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}`
  );
  return data;
}

export async function getEnrolledCourses(page: number, limit: number) {
  const { data } = await apiClient.get<{
    courses: CourseWithEnrollments[];
    count: number;
  }>(`${baseUrl}/enrolled?page=${page}&limit=${limit}`);
  return data;
}

export async function completeLesson(
  courseId: number,
  sectionId: number,
  lessonId: number,
  enrollmentId: number
) {
  const { data } = await apiClient.post<{ progress: number }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}/complete`,
    { enrollmentId }
  );
  return data;
}

export async function checkIfLessonCompleted(
  courseId: number,
  sectionId: number,
  lessonId: number,
  enrollmentId: number
) {
  const { data } = await apiClient.get<{ completed: boolean }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}/completed?enrollmentId=${enrollmentId}`
  );
  return data;
}

export async function checkPreviousSectionCompleted(
  courseId: number,
  sectionId: number,
  enrollmentId: number
) {
  const { data } = await apiClient.get<{ completed: boolean }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/previous-completed?enrollmentId=${enrollmentId}`
  );
  return data;
}

export async function checkPreviousLessonCompleted(
  courseId: number,
  sectionId: number,
  lessonId: number,
  enrollmentId: number
) {
  const { data } = await apiClient.get<{ completed: boolean }>(
    `${baseUrl}/${courseId}/sections/${sectionId}/lessons/${lessonId}/previous-completed?enrollmentId=${enrollmentId}`
  );
  return data;
}
