ALTER TABLE "played-it_account" ADD COLUMN "role" varchar DEFAULT 'USER' NOT NULL;--> statement-breakpoint
ALTER TABLE "played-it_user" ADD COLUMN "role" varchar DEFAULT 'USER' NOT NULL;