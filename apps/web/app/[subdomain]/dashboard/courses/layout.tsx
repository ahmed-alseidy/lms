"use client";
import "reflect-metadata";

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="md:p-6 pb-6">{children}</div>;
}
