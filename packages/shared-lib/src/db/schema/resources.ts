import { InferSelectModel, relations } from "drizzle-orm";
import {
  bigint,
  integer,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { courses, enrollments, lessons } from "./course";

// Lesson resources table (for PDFs per lesson)
export const lessonResources = pgTable("lesson_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessons.id, {
      onDelete: "cascade",
    }),
  title: varchar("title", { length: 255 }).notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(), // S3 key for the file
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // e.g., "application/pdf"
  fileSize: bigint("file_size", { mode: "number" }).notNull(), // File size in bytes
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Course resources table (for resource library per course)
export const courseResources = pgTable("course_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, {
      onDelete: "cascade",
    }),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  fileKey: varchar("file_key", { length: 500 }).notNull(), // S3 key for the file
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // e.g., "application/pdf"
  fileSize: bigint("file_size", { mode: "number" }).notNull(), // File size in bytes
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Resource downloads table (for download tracking)
export const resourceDownloads = pgTable("resource_downloads", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id")
    .references(() => enrollments.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    })
    .notNull(),
  resourceType: varchar("resource_type", { length: 20 }).notNull(), // "lesson" or "course"
  lessonResourceId: uuid("lesson_resource_id").references(
    () => lessonResources.id,
    {
      onDelete: "cascade",
    }
  ),
  courseResourceId: uuid("course_resource_id").references(
    () => courseResources.id,
    {
      onDelete: "cascade",
    }
  ),
  downloadedAt: timestamp("downloaded_at", { withTimezone: true }).defaultNow(),
});

// Relations for lesson resources
export const lessonResourcesRelations = relations(
  lessonResources,
  ({ one, many }) => ({
    lesson: one(lessons, {
      fields: [lessonResources.lessonId],
      references: [lessons.id],
    }),
    downloads: many(resourceDownloads),
  })
);

// Relations for course resources
export const courseResourcesRelations = relations(
  courseResources,
  ({ one, many }) => ({
    course: one(courses, {
      fields: [courseResources.courseId],
      references: [courses.id],
    }),
    downloads: many(resourceDownloads),
  })
);

// Relations for resource downloads
export const resourceDownloadsRelations = relations(
  resourceDownloads,
  ({ one }) => ({
    enrollment: one(enrollments, {
      fields: [resourceDownloads.enrollmentId],
      references: [enrollments.id],
    }),
    lessonResource: one(lessonResources, {
      fields: [resourceDownloads.lessonResourceId],
      references: [lessonResources.id],
    }),
    courseResource: one(courseResources, {
      fields: [resourceDownloads.courseResourceId],
      references: [courseResources.id],
    }),
  })
);

export type SelectLessonResource = InferSelectModel<typeof lessonResources>;
export type SelectCourseResource = InferSelectModel<typeof courseResources>;
export type SelectResourceDownload = InferSelectModel<typeof resourceDownloads>;
