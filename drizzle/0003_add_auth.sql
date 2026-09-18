CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `signals` ADD COLUMN `user_id` text REFERENCES `users`(`id`) ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE `dashboards` ADD COLUMN `user_id` text REFERENCES `users`(`id`) ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE `matches` ADD COLUMN `user_id` text REFERENCES `users`(`id`) ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);
--> statement-breakpoint
CREATE INDEX `idx_signals_user_id` ON `signals` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_dashboards_user_id` ON `dashboards` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_matches_user_id` ON `matches` (`user_id`);
