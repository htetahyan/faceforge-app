ALTER TABLE "users" ADD COLUMN "password_reset_otp" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expiry" timestamp with time zone;