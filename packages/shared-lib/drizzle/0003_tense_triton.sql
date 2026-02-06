ALTER TYPE "public"."question_type" ADD VALUE 'essay';--> statement-breakpoint
ALTER TABLE "quiz_responses" ALTER COLUMN "answer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "submitted_question_answers" ALTER COLUMN "answer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_responses" ADD COLUMN "text_answer" text;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "status" varchar DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "auto_score" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "submitted_question_answers" ADD COLUMN "text_answer" text;