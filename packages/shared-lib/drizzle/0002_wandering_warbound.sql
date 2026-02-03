CREATE TABLE "course_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(500),
	"file_key" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lesson_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resource_downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"resource_type" varchar(20) NOT NULL,
	"lesson_resource_id" uuid,
	"course_resource_id" uuid,
	"downloaded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "course_resources" ADD CONSTRAINT "course_resources_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_downloads" ADD CONSTRAINT "resource_downloads_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "resource_downloads" ADD CONSTRAINT "resource_downloads_lesson_resource_id_lesson_resources_id_fk" FOREIGN KEY ("lesson_resource_id") REFERENCES "public"."lesson_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_downloads" ADD CONSTRAINT "resource_downloads_course_resource_id_course_resources_id_fk" FOREIGN KEY ("course_resource_id") REFERENCES "public"."course_resources"("id") ON DELETE cascade ON UPDATE no action;