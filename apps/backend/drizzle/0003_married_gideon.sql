CREATE TYPE "public"."session_status" AS ENUM('draft', 'live', 'ended');--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"released_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_host_id_hosts_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "room_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "status" "session_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_room_code_unique_ci" ON "sessions" USING btree (lower("room_code"));--> statement-breakpoint
CREATE INDEX "sessions_host_id_idx" ON "sessions" USING btree ("host_id");