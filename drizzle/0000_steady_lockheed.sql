CREATE TABLE `dashboard_signals` (
	`dashboard_id` text NOT NULL,
	`signal_id` text NOT NULL,
	PRIMARY KEY(`dashboard_id`, `signal_id`),
	FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`signal_id`) REFERENCES `signals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dashboards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`filters_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`game_index` integer NOT NULL,
	`player_on_play` text NOT NULL,
	`opening_hand_size` integer NOT NULL,
	`winner` text NOT NULL,
	`coinflip_won` integer,
	`signals_json` text NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `match_dashboards` (
	`match_id` text NOT NULL,
	`dashboard_id` text NOT NULL,
	PRIMARY KEY(`match_id`, `dashboard_id`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`deck` text NOT NULL,
	`opponent` text DEFAULT '' NOT NULL,
	`format` text DEFAULT '' NOT NULL,
	`play_mode` text DEFAULT '' NOT NULL,
	`match_type` text NOT NULL,
	`tags_json` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`winner` text NOT NULL,
	`signals_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `signals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`scope` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
