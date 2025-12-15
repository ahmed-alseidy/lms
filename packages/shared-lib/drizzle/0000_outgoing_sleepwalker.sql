CREATE TABLE "course_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"code" varchar(16) NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"assigned_to" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"used_at" timestamp with time zone,
	CONSTRAINT "course_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "course_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar,
	"price" numeric(10, 2) NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"lessons_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"order_index" integer NOT NULL,
	"section_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_lesson_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "student_lesson_completion_unique" UNIQUE NULLS NOT DISTINCT("enrollment_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"teacher_id" integer NOT NULL,
	"hashed_refresh_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"teacher_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"subdomain" text NOT NULL,
	"profile_picture_url" text,
	"hashed_refresh_token" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"contact_info" text,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "teachers_email_unique" UNIQUE("email"),
	CONSTRAINT "teachers_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "student_video_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"video_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "student_video_completion_unique" UNIQUE NULLS NOT DISTINCT("enrollment_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"manifest_key" varchar(255) NOT NULL,
	"segments_key" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TYPE "question_type" AS ENUM ('mcq','true_false');
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"answer_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"order_index" integer NOT NULL,
	"question_type" question_type NOT NULL DEFAULT 'mcq'
);
--> statement-breakpoint
CREATE TABLE "quiz_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"quiz_id" uuid NOT NULL,
	"student_id" integer NOT NULL,
	"score" numeric(10, 2) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "quiz_submission_unique" UNIQUE NULLS NOT DISTINCT("enrollment_id","quiz_id")
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"duration" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "submitted_question_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"answer_id" integer NOT NULL,
	"submission_id" integer NOT NULL,
	CONSTRAINT "submitted_question_answer_unique" UNIQUE("question_id","answer_id")
);
--> statement-breakpoint
ALTER TABLE "course_codes" ADD CONSTRAINT "course_codes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_codes" ADD CONSTRAINT "course_codes_assigned_to_students_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_teachers_teacher_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("teacher_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_lesson_completions" ADD CONSTRAINT "student_lesson_completions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_lesson_completions" ADD CONSTRAINT "student_lesson_completions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_teacher_id_teachers_teacher_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("teacher_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_video_completions" ADD CONSTRAINT "student_video_completions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_video_completions" ADD CONSTRAINT "student_video_completions_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submitted_question_answers" ADD CONSTRAINT "submitted_question_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submitted_question_answers" ADD CONSTRAINT "submitted_question_answers_answer_id_quiz_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."quiz_answers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submitted_question_answers" ADD CONSTRAINT "submitted_question_answers_submission_id_quiz_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."quiz_submissions"("id") ON DELETE cascade ON UPDATE cascade;