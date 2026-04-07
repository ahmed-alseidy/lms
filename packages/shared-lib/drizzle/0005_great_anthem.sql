ALTER TABLE "videos" ALTER COLUMN "manifest_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "segments_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "plan" varchar(20) DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "video_type" varchar(20) DEFAULT 's3';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "mux_asset_id" varchar(255);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "mux_playback_id" varchar(255);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "mux_status" varchar(20) DEFAULT 'waiting';