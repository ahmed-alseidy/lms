"use client";

import "reflect-metadata";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { redirect, useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { toast } from "sonner";
import { getCourse } from "@/lib/courses";
import { attempt } from "@/lib/utils";

export default function CourseLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const courseId = Number(params.courseId);
  const t = useTranslations();
  const router = useRouter();

  const { data: courseResponse, isLoading } = useQuery({
    queryKey: ["student-course", courseId],
    queryFn: async () => {
      const [response, error] = await attempt(getCourse(courseId, true, true));
      if (error) {
        toast.error(t("common.somethingWentWrong"));
        return;
      }
      return response;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return <div>{children}</div>;
}
