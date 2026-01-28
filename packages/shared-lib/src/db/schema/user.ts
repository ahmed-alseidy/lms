import { InferSelectModel, relations, sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { courses } from "./course";

export const teachers = pgTable("teachers", {
  teacherId: serial("teacher_id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: text("email").unique().notNull(),
  subdomain: text("subdomain").notNull().unique(),
  profilePictureUrl: text("profile_picture_url"),
  hashedRefreshToken: text("hashed_refresh_token"),
  authUserId: text("auth_user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  contactInfo: text("contact_info"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.teacherId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    authUserId: text("auth_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    hashedRefreshToken: text("hashed_refresh_token"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (s) => [
    {
      unique: unique().on(s.email, s.teacherId),
    },
  ]
);

export const teacherRelations = relations(teachers, ({ many, one }) => ({
  courses: many(courses),
  students: many(students),
  user: one(users, {
    fields: [teachers.authUserId],
    references: [users.id],
  }),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  teacher: one(teachers, {
    fields: [students.teacherId],
    references: [teachers.teacherId],
  }),
  user: one(users, {
    fields: [students.authUserId],
    references: [users.id],
  }),
}));

export type SelectTeacher = InferSelectModel<typeof teachers>;
export type SelectStudent = InferSelectModel<typeof students>;
