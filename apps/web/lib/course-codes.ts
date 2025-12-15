import { CourseCode } from "@lms-saas/shared-lib";
import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";
import { attempt } from "./utils";

const baseUrl = `${BACKEND_URL}`;

export const generateCourseCodes = (courseId: number, quantity: number) => {
  return authFetch<{ message: string }>(
    `${baseUrl}/courses/${courseId}/course-codes/generate`,
    {
      method: "POST",
      data: { quantity },
    }
  );
};

export const validateCourseCode = (courseId: number, code: string) => {
  return authFetch<{ message: string }>(
    `${baseUrl}/courses/${courseId}/course-codes/validate`,
    {
      method: "POST",
      data: { code },
    }
  );
};

export const getCourseCodes = async (courseId: number) => {
  return await authFetch<
    (CourseCode & { student: { name: string; email: string } })[]
  >(`${baseUrl}/courses/${courseId}/course-codes`);
};
