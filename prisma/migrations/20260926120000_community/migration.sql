ALTER TABLE "users"
  ADD COLUMN "community_name" VARCHAR(60),
  ADD COLUMN "community_handle" VARCHAR(30),
  ADD COLUMN "avatar_emoji" VARCHAR(16),
  ADD COLUMN "avatar_bg" VARCHAR(7);

CREATE UNIQUE INDEX "users_community_handle_key" ON "users"("community_handle");

CREATE TABLE "community_posts" (
  "id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "tag" VARCHAR(32) NOT NULL DEFAULT 'Desabafo',
  "text" VARCHAR(2000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_comments" (
  "id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "text" VARCHAR(1000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_welcomes" (
  "post_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_welcomes_pkey" PRIMARY KEY ("post_id", "user_id")
);

CREATE INDEX "community_posts_created_at_id_idx" ON "community_posts"("created_at" DESC, "id" DESC);
CREATE INDEX "community_comments_post_id_created_at_id_idx" ON "community_comments"("post_id", "created_at", "id");

ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_welcomes" ADD CONSTRAINT "community_welcomes_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_welcomes" ADD CONSTRAINT "community_welcomes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
