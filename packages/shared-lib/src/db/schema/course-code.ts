import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { courses } from "./course";
import { students } from "./user";
export const courseCodes = pgTable("course_codes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, {
      onDelete: "cascade",
    }),
  code: varchar("code", { length: 16 }).notNull().unique(),
  isUsed: boolean("is_used").notNull().default(false),
  assignedTo: integer("assigned_to").references(() => students.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const courseCodesRelations = relations(courseCodes, ({ one }) => ({
  course: one(courses, {
    fields: [courseCodes.courseId],
    references: [courses.id],
  }),
  student: one(students, {
    fields: [courseCodes.assignedTo],
    references: [students.id],
  }),
}));

export type CourseCode = typeof courseCodes.$inferSelect;
