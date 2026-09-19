PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`role` text NOT NULL,
	`position` integer NOT NULL,
	`content` text NOT NULL,
	`reasoning` text,
	`finish_reason` text,
	`context_used` integer,
	`context_size` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "messages_assistant_only_fields" CHECK("__new_messages"."role" = 'assistant' or ("__new_messages"."reasoning" is null and "__new_messages"."finish_reason" is null and "__new_messages"."context_used" is null and "__new_messages"."context_size" is null))
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "chat_id", "role", "position", "content", "reasoning", "finish_reason", "context_used", "context_size", "created_at", "updated_at") SELECT "id", "chat_id", "role", "position", "content", "reasoning", "finish_reason", NULL, NULL, "created_at", "updated_at" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `messages_chat_id_position_idx` ON `messages` (`chat_id`,`position`);
