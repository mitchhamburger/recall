-- Snapshot of the local Recall data at the time hosted persistence was introduced.
-- INSERT OR IGNORE keeps this migration safe if defaults already exist.
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('0f4269b5-e80b-4372-8e34-74f89fa0a8e2', 'Played Urza''s Saga on turn 1', 'game', 'Check this for any game where your first turn included Urza''s Saga.', '2026-06-02 00:11:16');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('78cab42f-fcca-4cdc-9e35-139092cbed14', 'Won the opening roll', 'match', 'Usually based on the game 1 random determination.', '2026-06-02 00:11:16');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('7d0468c9-2ff0-4a4f-b59d-821626bb2e76', 'Cast Chrysalis', 'game', '', '2026-06-04 19:57:00');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('e8f485c7-150a-4f45-8656-37961ee7df1a', 'Saga in opener but didn''t play it turn 1', 'game', '', '2026-06-04 19:57:52');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('d14cd311-83db-499f-bb29-1eb6771cf107', 'No colorless land in opener', 'game', '', '2026-06-04 19:58:19');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('995c0f1e-c452-48ca-8660-aeaef9d96f62', 'Can-trip in opener', 'game', 'Stirrings or Rumble', '2026-06-04 19:58:55');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('49939488-cc11-4359-9479-ec0f5ddceb1f', 'Eldrazi Temple in opener', 'game', '', '2026-06-04 19:59:39');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('62913404-c594-49af-ba0a-08cd8528377f', 'Turn two fleshraker', 'game', '', '2026-06-04 20:00:01');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('403585f6-848d-4a9b-a490-cc8709ed3345', 'Gemstone Caverns Pregame', 'game', '', '2026-06-04 20:00:20');
--> statement-breakpoint
INSERT OR IGNORE INTO `signals` (`id`, `name`, `scope`, `description`, `created_at`) VALUES ('0d476c66-5a05-4150-b0d6-559489c7e665', 'Broodscale turn 2', 'game', '', '2026-06-04 20:08:43');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboards` (`id`, `name`, `filters_json`, `created_at`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', 'Broodscale MTGO', '{"deck":"","opponent":"","playMode":"","format":"","tag":""}', '2026-06-04 21:16:30');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('cca6db9a-871a-44d4-8657-bd3dcd13846f', '2026-06-02', 'Unspecified', '', '', '', 'bo1', '[]', 'Smoke test match', 'me', '{}', '2026-06-02 00:48:40');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('0396f545-2023-4fbf-8896-19aadb0d68ba', '2026-06-01', 'Unspecified', '', '', '', 'bo3', '[]', '', 'me', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":true,"78cab42f-fcca-4cdc-9e35-139092cbed14":true}', '2026-06-02 00:53:21');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('c0973814-542e-415f-a96e-03c41a936669', '2026-06-04', 'Unspecified', '', '', '', 'bo3', '[]', '', 'me', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":false,"78cab42f-fcca-4cdc-9e35-139092cbed14":true}', '2026-06-04 22:09:50');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('b2c84f2a-f813-4cb5-86a5-7dcf063520e2', '2026-06-04', 'Unspecified', '', '', '', 'bo3', '[]', '', 'me', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":false,"78cab42f-fcca-4cdc-9e35-139092cbed14":false}', '2026-06-04 22:28:56');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('d5ab863e-830f-4412-97f2-af2e241fdec3', '2026-06-04', 'Unspecified', '', '', '', 'bo3', '[]', '', 'me', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":false,"78cab42f-fcca-4cdc-9e35-139092cbed14":false}', '2026-06-04 23:06:19');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('f9985a18-ba18-40f0-b321-fb52798d2bfe', '2026-06-05', 'Unspecified', '', '', '', 'bo3', '[]', '', 'opponent', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":false,"78cab42f-fcca-4cdc-9e35-139092cbed14":false}', '2026-06-05 15:30:29');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('c66424d5-81ce-4e55-8441-deda7518a3c5', '2026-06-05', 'Unspecified', '', '', '', 'bo3', '[]', '', 'me', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":false,"78cab42f-fcca-4cdc-9e35-139092cbed14":true}', '2026-06-05 16:10:43');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('a5b005b3-bd1e-4cc0-8ad7-b0ac81d76ae2', '2026-06-05', 'Unspecified', '', '', '', 'bo3', '[]', '', 'opponent', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":false,"78cab42f-fcca-4cdc-9e35-139092cbed14":false}', '2026-06-05 17:13:13');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('0232b462-3633-4b7e-8f15-ee8e05672c70', '2026-06-05', 'Unspecified', '', '', '', 'bo3', '[]', '', 'opponent', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":false,"78cab42f-fcca-4cdc-9e35-139092cbed14":false}', '2026-06-05 21:53:29');
--> statement-breakpoint
INSERT OR IGNORE INTO `matches` (`id`, `date`, `deck`, `opponent`, `format`, `play_mode`, `match_type`, `tags_json`, `notes`, `winner`, `signals_json`, `created_at`) VALUES ('18284bd3-1659-41aa-9880-8672ff2a8d90', '2026-06-05', 'Unspecified', '', '', '', 'bo3', '[]', '', 'me', '{"bde6a8d1-6c56-438a-acf3-d7588b88485f":false,"78cab42f-fcca-4cdc-9e35-139092cbed14":true}', '2026-06-05 22:29:49');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('11b8fe98-740b-4abb-a286-396351fece72', 'cca6db9a-871a-44d4-8657-bd3dcd13846f', 1, 'me', 7, 'me', 1, '{}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('8fc3522e-0bad-47fb-a76d-14efa94bf2fe', '0396f545-2023-4fbf-8896-19aadb0d68ba', 1, 'me', 7, 'me', NULL, '{"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":true}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('d432b604-2c01-4cf3-96fe-45c223b04ea0', '0396f545-2023-4fbf-8896-19aadb0d68ba', 2, 'me', 7, 'opponent', NULL, '{"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('597de186-1497-47ca-b240-5d135f981753', '0396f545-2023-4fbf-8896-19aadb0d68ba', 3, 'me', 7, 'me', NULL, '{"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('eb0ba631-3d2a-49b9-bfde-e3561633cc3d', 'c0973814-542e-415f-a96e-03c41a936669', 1, 'me', 7, 'opponent', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":true,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":true,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('8f18f4c9-4f9e-41c2-b182-08b3bd1648ee', 'c0973814-542e-415f-a96e-03c41a936669', 2, 'me', 7, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":true,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":true}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('4e30460d-b1bd-4d43-b12d-5d99193f33c3', 'c0973814-542e-415f-a96e-03c41a936669', 3, 'opponent', 7, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":true,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":true}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('8f9bf4ce-974d-4569-87a4-2fbca37a8c99', 'b2c84f2a-f813-4cb5-86a5-7dcf063520e2', 1, 'me', 7, 'me', 0, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":true,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":true,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('c9063653-5e33-4c05-8c18-ef9200906d16', 'b2c84f2a-f813-4cb5-86a5-7dcf063520e2', 2, 'opponent', 6, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":true,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('c36c1811-6a63-43d8-832c-6f4e94d787f5', 'd5ab863e-830f-4412-97f2-af2e241fdec3', 1, 'opponent', 6, 'me', 0, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":false,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":true,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('3acbaea4-247b-4688-bb0a-203196353e60', 'd5ab863e-830f-4412-97f2-af2e241fdec3', 2, 'opponent', 7, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":true,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":true,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":true,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('57f8c033-ab0a-46ba-a4f4-b9adac1b1fa4', 'f9985a18-ba18-40f0-b321-fb52798d2bfe', 1, 'opponent', 7, 'opponent', 0, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":true,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":false,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":true,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('7d48cb40-d3d0-4a4c-a8d2-0f4035a27ef0', 'f9985a18-ba18-40f0-b321-fb52798d2bfe', 2, 'me', 7, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":true,"49939488-cc11-4359-9479-ec0f5ddceb1f":true,"995c0f1e-c452-48ca-8660-aeaef9d96f62":false,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('6558cfe5-18be-4be0-bbcf-9df8b00af5f6', 'f9985a18-ba18-40f0-b321-fb52798d2bfe', 3, 'opponent', 7, 'opponent', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":true}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('1e92a0f6-5da4-47cb-ad36-b44886c98954', 'c66424d5-81ce-4e55-8441-deda7518a3c5', 1, 'me', 7, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":true,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('81c61cb8-6099-4b33-9d64-ea7ad0e030fa', 'c66424d5-81ce-4e55-8441-deda7518a3c5', 2, 'opponent', 7, 'opponent', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":true,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":false,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":true,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('694deb6c-d3d0-4961-913c-1d95e70fe6c8', 'c66424d5-81ce-4e55-8441-deda7518a3c5', 3, 'me', 7, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":true,"49939488-cc11-4359-9479-ec0f5ddceb1f":true,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('d8f04460-d827-4fb3-a896-073a4195a892', 'a5b005b3-bd1e-4cc0-8ad7-b0ac81d76ae2', 1, 'opponent', 7, 'opponent', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":true,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('46486cf5-5f64-404b-8e26-c7add2782efe', 'a5b005b3-bd1e-4cc0-8ad7-b0ac81d76ae2', 2, 'me', 7, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":true,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":true}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('9dbb0b01-8206-4e83-9261-6d7bd4e5dcd6', 'a5b005b3-bd1e-4cc0-8ad7-b0ac81d76ae2', 3, 'opponent', 7, 'opponent', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":true,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":true,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":true}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('2b688975-40bd-44fc-a767-3814f3ef727e', '0232b462-3633-4b7e-8f15-ee8e05672c70', 1, 'opponent', 7, 'opponent', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":true,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":true,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":true}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('c3284dc8-e302-449f-8893-42dcf94e6bbf', '0232b462-3633-4b7e-8f15-ee8e05672c70', 2, 'me', 6, 'opponent', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":true,"995c0f1e-c452-48ca-8660-aeaef9d96f62":false,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":true,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('4e05c73e-8a0f-4f72-8c1e-efed5334b6df', '18284bd3-1659-41aa-9880-8672ff2a8d90', 1, 'me', 7, 'opponent', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":true,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":false,"995c0f1e-c452-48ca-8660-aeaef9d96f62":true,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":true,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":false}');
--> statement-breakpoint
INSERT OR IGNORE INTO `games` (`id`, `match_id`, `game_index`, `player_on_play`, `opening_hand_size`, `winner`, `coinflip_won`, `signals_json`) VALUES ('c9f97f25-4294-4974-a9de-68377423dab3', '18284bd3-1659-41aa-9880-8672ff2a8d90', 2, 'me', 7, 'me', NULL, '{"0d476c66-5a05-4150-b0d6-559489c7e665":false,"403585f6-848d-4a9b-a490-cc8709ed3345":false,"62913404-c594-49af-ba0a-08cd8528377f":false,"49939488-cc11-4359-9479-ec0f5ddceb1f":true,"995c0f1e-c452-48ca-8660-aeaef9d96f62":false,"d14cd311-83db-499f-bb29-1eb6771cf107":false,"e8f485c7-150a-4f45-8656-37961ee7df1a":false,"7d0468c9-2ff0-4a4f-b59d-821626bb2e76":false,"0f4269b5-e80b-4372-8e34-74f89fa0a8e2":true}');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', '0d476c66-5a05-4150-b0d6-559489c7e665');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', '403585f6-848d-4a9b-a490-cc8709ed3345');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', '62913404-c594-49af-ba0a-08cd8528377f');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', '49939488-cc11-4359-9479-ec0f5ddceb1f');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', '995c0f1e-c452-48ca-8660-aeaef9d96f62');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', 'd14cd311-83db-499f-bb29-1eb6771cf107');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', 'e8f485c7-150a-4f45-8656-37961ee7df1a');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', '7d0468c9-2ff0-4a4f-b59d-821626bb2e76');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', '78cab42f-fcca-4cdc-9e35-139092cbed14');
--> statement-breakpoint
INSERT OR IGNORE INTO `dashboard_signals` (`dashboard_id`, `signal_id`) VALUES ('a94e4755-633a-4940-acfc-e736e2f1067b', '0f4269b5-e80b-4372-8e34-74f89fa0a8e2');
--> statement-breakpoint
INSERT OR IGNORE INTO `match_dashboards` (`match_id`, `dashboard_id`) VALUES ('c0973814-542e-415f-a96e-03c41a936669', 'a94e4755-633a-4940-acfc-e736e2f1067b');
--> statement-breakpoint
INSERT OR IGNORE INTO `match_dashboards` (`match_id`, `dashboard_id`) VALUES ('b2c84f2a-f813-4cb5-86a5-7dcf063520e2', 'a94e4755-633a-4940-acfc-e736e2f1067b');
--> statement-breakpoint
INSERT OR IGNORE INTO `match_dashboards` (`match_id`, `dashboard_id`) VALUES ('d5ab863e-830f-4412-97f2-af2e241fdec3', 'a94e4755-633a-4940-acfc-e736e2f1067b');
--> statement-breakpoint
INSERT OR IGNORE INTO `match_dashboards` (`match_id`, `dashboard_id`) VALUES ('f9985a18-ba18-40f0-b321-fb52798d2bfe', 'a94e4755-633a-4940-acfc-e736e2f1067b');
--> statement-breakpoint
INSERT OR IGNORE INTO `match_dashboards` (`match_id`, `dashboard_id`) VALUES ('c66424d5-81ce-4e55-8441-deda7518a3c5', 'a94e4755-633a-4940-acfc-e736e2f1067b');
--> statement-breakpoint
INSERT OR IGNORE INTO `match_dashboards` (`match_id`, `dashboard_id`) VALUES ('a5b005b3-bd1e-4cc0-8ad7-b0ac81d76ae2', 'a94e4755-633a-4940-acfc-e736e2f1067b');
--> statement-breakpoint
INSERT OR IGNORE INTO `match_dashboards` (`match_id`, `dashboard_id`) VALUES ('0232b462-3633-4b7e-8f15-ee8e05672c70', 'a94e4755-633a-4940-acfc-e736e2f1067b');
--> statement-breakpoint
INSERT OR IGNORE INTO `match_dashboards` (`match_id`, `dashboard_id`) VALUES ('18284bd3-1659-41aa-9880-8672ff2a8d90', 'a94e4755-633a-4940-acfc-e736e2f1067b');
--> statement-breakpoint
