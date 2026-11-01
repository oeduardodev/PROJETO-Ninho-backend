CREATE TABLE "conversations" (
  "id" UUID NOT NULL,
  "pair_key" VARCHAR(73) NOT NULL,
  "participant_a_id" UUID NOT NULL,
  "participant_b_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "conversations_distinct_participants" CHECK ("participant_a_id" <> "participant_b_id")
);

CREATE TABLE "conversation_messages" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "sender_id" UUID NOT NULL,
  "text" VARCHAR(2000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMP(3),
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversations_pair_key_key" ON "conversations"("pair_key");
CREATE INDEX "conversations_participant_a_id_updated_at_idx" ON "conversations"("participant_a_id", "updated_at" DESC);
CREATE INDEX "conversations_participant_b_id_updated_at_idx" ON "conversations"("participant_b_id", "updated_at" DESC);
CREATE INDEX "conversation_messages_conversation_id_created_at_id_idx" ON "conversation_messages"("conversation_id", "created_at" DESC, "id" DESC);
CREATE INDEX "conversation_messages_conversation_id_sender_id_read_at_idx" ON "conversation_messages"("conversation_id", "sender_id", "read_at");

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_a_id_fkey"
  FOREIGN KEY ("participant_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_b_id_fkey"
  FOREIGN KEY ("participant_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
