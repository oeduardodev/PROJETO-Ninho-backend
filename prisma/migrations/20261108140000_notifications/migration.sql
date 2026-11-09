CREATE TYPE "NotificationType" AS ENUM ('WELCOME', 'COMMENT');

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "actor_id" UUID,
  "type" "NotificationType" NOT NULL,
  "message" VARCHAR(280) NOT NULL,
  "entity_type" VARCHAR(32),
  "entity_id" VARCHAR(64),
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
