CREATE INDEX IF NOT EXISTS "face_profiles_user_id_idx" ON "face_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generation_tasks_user_id_idx" ON "generation_tasks" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generation_tasks_template_id_idx" ON "generation_tasks" ("template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "templates_category_id_idx" ON "templates" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favorites_user_id_idx" ON "user_favorites" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favorites_template_id_idx" ON "user_favorites" ("template_id");