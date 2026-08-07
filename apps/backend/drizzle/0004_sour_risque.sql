CREATE TYPE "public"."poll_type" AS ENUM('single_choice', 'multiple_choice', 'open_ended');--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"text" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "type" "poll_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "max_selections" integer;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "is_open" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "results_revealed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "has_responses" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "poll_options_poll_id_idx" ON "poll_options" USING btree ("poll_id");--> statement-breakpoint
CREATE UNIQUE INDEX "polls_one_open_per_session" ON "polls" USING btree ("session_id") WHERE "polls"."is_open";--> statement-breakpoint
CREATE INDEX "polls_session_id_idx" ON "polls" USING btree ("session_id");