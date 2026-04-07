import { SelectStudent, SelectTeacher } from "@lms-saas/shared-lib";
import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

const baseUrl = BACKEND_URL + "/users";

export const findCurrentUser = () => {
  return authFetch<SelectTeacher | SelectStudent>(`${baseUrl}/current-user`);
};

export const getTeacherProfile = () => {
  return authFetch<{
    teacherId: number;
    plan: string;
    subdomain: string;
    name: string;
    email: string;
    profilePictureUrl: string | null;
    contactInfo: string | null;
  }>(`${baseUrl}/teacher-profile`);
};

export const updateTeacherProfile = (data: {
  name: string;
  contactInfo?: string | null;
}) => {
  return authFetch(`${baseUrl}/teacher-profile`, {
    method: "PATCH",
    data,
  });
};
