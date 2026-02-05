import { CreateVideoDto, UploadDto } from "@lms-saas/shared-lib";
import axios from "axios";
import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";
import { attempt } from "./utils";

const baseUrl = `${BACKEND_URL}/lessons`;

export interface Video {
  id: string;
  title: string;
  manifestKey: string;
  segmentsKey: string;
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

export const createVideo = (lessonId: number, data: CreateVideoDto) => {
  return authFetch<Video>(`${baseUrl}/${lessonId}/videos`, {
    method: "POST",
    data,
  });
};

export const getUploadPresignedUrl = (lessonId: number, data: UploadDto) => {
  return authFetch<SignedUrlResponse>(
    `${BACKEND_URL}/s3/generate-presigned-url`,
    {
      method: "POST",
      data,
    }
  );
};

export const uploadVideo = async (
  file: File,
  presignedPostInput: SignedUrlResponse,
  setProgress: (progress: number) => void
) => {
  const { url, fields } = presignedPostInput;

  const formData = new FormData();

  // Add all fields from the presigned URL first
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value as string);
  });

  // Add the file last
  formData.append("file", file);

  try {
    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progress) =>
        setProgress((progress.loaded / (progress.total || 1)) * 100),
    });
    return response;
  } catch (error) {
    console.error("Upload failed:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
    }
    throw error;
  }
};

export const deleteVideo = (lessonId: number, id: string) => {
  return authFetch(`${baseUrl}/${lessonId}/videos/${id}`, {
    method: "DELETE",
  });
};

export const getVideo = (lessonId: number, id: string) => {
  return authFetch<{
    videoId: string;
    manifestUrl: string;
    segmentsBaseUrl: string;
  }>(`${baseUrl}/${lessonId}/videos/${id}`, {
    method: "GET",
  });
};

export const checkIfVideoCompleted = async (
  lessonId: number,
  videoId: string,
  enrollmentId: number
) => {
  const query = enrollmentId ? `?enrollmentId=${enrollmentId}` : "";
  return authFetch<{ completed: boolean }>(
    `${baseUrl}/${lessonId}/videos/${videoId}/completed${query}`,
    {
      method: "GET",
    }
  );
};

export const completeVideo = (
  lessonId: number,
  videoId: string,
  enrollmentId: number
) => {
  return authFetch<{ message: string }>(
    `${baseUrl}/${lessonId}/videos/${videoId}/complete`,
    {
      method: "POST",
      data: { enrollmentId },
    }
  );
};
