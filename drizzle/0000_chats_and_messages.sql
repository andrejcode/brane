CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`model_file` text NOT NULL,
	`model_size_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chats_updated_at_idx` ON `chats` (`updated_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`role` text NOT NULL,
	`position` integer NOT NULL,
	`content` text NOT NULL,
	`reasoning` text,
	`finish_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "messages_assistant_only_fields" CHECK("messages"."role" = 'assistant' or ("messages"."reasoning" is null and "messages"."finish_reason" is null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_chat_id_position_idx` ON `messages` (`chat_id`,`position`);