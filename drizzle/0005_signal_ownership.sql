ALTER TABLE `signals` ADD COLUMN `dashboard_id` text REFERENCES `dashboards`(`id`) ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX `idx_signals_dashboard_id` ON `signals` (`dashboard_id`);
