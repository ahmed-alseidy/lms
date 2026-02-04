import { UploadDto } from "@lms-saas/shared-lib";
import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

export interface LessonResource {
  id: string;
  lessonId: number;
  title: string;
  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface CourseResource {
  id: string;
  courseId: number;
  title: string;
  description?: string;
  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export type Fields = {
  key: string;
  expiresIn: string;
  bucket: string;
  "X-Amz-Algorithm": string;
  "X-Amz-Credential": string;
  "X-Amz-Date": string;
  Policy: string;
  "X-Amz-Signature": string;
};

export type SignedUrlResponse = {
  url: string;
  fields: Fields;
};

export const getUploadPresignedUrl = (data: UploadDto) => {
  return authFetch<SignedUrlResponse>(
    `${BACKEND_URL}/s3/generate-presigned-url`,
    {
      method: "POST",
      data,
    }
  );
};

export const uploadFile = async (
  file: File,
  presignedPostInput: SignedUrlResponse,
  setProgress: (progress: number) => void
) => {
  const { url, fields } = presignedPostInput;

  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value as string);
  });

  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  // Fetch doesn't give incremental progress; set 100% at the end
  setProgress(100);
};

// ---- Lesson resources ----

export const getLessonResources = (lessonId: number) => {
  return authFetch<LessonResource[]>(
    `${BACKEND_URL}/lessons/${lessonId}/resources`,
    { method: "GET" }
  );
};

export const getLessonResource = (
  lessonId: number,
  id: string,
  enrollmentId?: number
) => {
  return authFetch<LessonResource & { downloadUrl: string }>(
    `${BACKEND_URL}/lessons/${lessonId}/resources/${id}?enrollmentId=${enrollmentId ?? 0}`,
    { method: "GET" }
  );
};

export const createLessonResource = (
  lessonId: number,
  data: {
    title: string;
    fileKey: string;
    fileName: string;
    fileType: string;
    fileSize: string; // as in DTO
  }
) => {
  return authFetch<LessonResource>(
    `${BACKEND_URL}/lessons/${lessonId}/resources`,
    {
      method: "POST",
      data,
    }
  );
};

export const deleteLessonResource = (lessonId: number, id: string) => {
  return authFetch(`${BACKEND_URL}/lessons/${lessonId}/resources/${id}`, {
    method: "DELETE",
  });
};

export const getCourseResources = (courseId: number) => {
  return authFetch<CourseResource[]>(
    `${BACKEND_URL}/courses/${courseId}/resources`,
    { method: "GET" }
  );
};

export const getCourseResource = (
  courseId: number,
  id: string,
  enrollmentId?: number
) => {
  const query = enrollmentId != null ? `?enrollmentId=${enrollmentId}` : "";
  return authFetch<CourseResource & { downloadUrl: string }>(
    `${BACKEND_URL}/courses/${courseId}/resources/${id}${query}`,
    { method: "GET" }
  );
};

export const createCourseResource = (
  courseId: number,
  data: {
    title: string;
    description?: string;
    fileKey: string;
    fileName: string;
    fileType: string;
    fileSize: string;
  }
) => {
  return authFetch<CourseResource>(
    `${BACKEND_URL}/courses/${courseId}/resources`,
    {
      method: "POST",
      data,
    }
  );
};

export const deleteCourseResource = (courseId: number, id: string) => {
  return authFetch(`${BACKEND_URL}/courses/${courseId}/resources/${id}`, {
    method: "DELETE",
  });
};

// ---- Download stats (teacher) ----

export interface ResourceDownloadRecord {
  id: number;
  enrollmentId: number;
  resourceType: string;
  lessonResourceId: string | null;
  courseResourceId: string | null;
  downloadedAt: string;
}

export const getResourceDownloadStats = (
  resourceId: string,
  resourceType: "lesson" | "course"
) => {
  return authFetch<ResourceDownloadRecord[]>(
    `${BACKEND_URL}/resources/${resourceId}/downloads?type=${resourceType}`,
    { method: "GET" }
  );
};
