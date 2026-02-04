"use client";

import { Loader } from "lucide-react";

export const LoadingSpinner = () => {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <Loader className="text-muted-foreground h-10 w-10 animate-spin" />
    </div>
  );
};