CREATE TABLE IF NOT EXISTS `app_migrations` (
  `name` text PRIMARY KEY NOT NULL,
  `applied_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
UPDATE `signals`
SET `dashboard_id` = (
  SELECT MIN(`dashboard_signals`.`dashboard_id`)
  FROM `dashboard_signals`
  WHERE `dashboard_signals`.`signal_id` = `signals`.`id`
)
WHERE `dashboard_id` IS NULL
  AND `id` IN (
    SELECT `signal_id`
    FROM `dashboard_signals`
    GROUP BY `signal_id`
    HAVING COUNT(DISTINCT `dashboard_id`) = 1
  );
--> statement-breakpoint
INSERT OR IGNORE INTO `app_migrations` (`name`) VALUES ('0006_localize_legacy_signals');
