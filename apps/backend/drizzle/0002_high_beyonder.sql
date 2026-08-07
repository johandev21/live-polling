ALTER TABLE "hosts" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_user_id_unique" UNIQUE("user_id");