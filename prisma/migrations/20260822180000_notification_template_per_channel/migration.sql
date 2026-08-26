DROP INDEX "notification_templates_key_key";

CREATE UNIQUE INDEX "notification_templates_key_channel_key" ON "notification_templates"("key", "channel");
