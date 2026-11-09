CREATE TYPE "ReportCategory" AS ENUM ('CONTENT', 'USER', 'APP_ERROR');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');

CREATE TABLE "reports" (
  "id" UUID NOT NULL,
  "reporter_id" UUID NOT NULL,
  "category" "ReportCategory" NOT NULL,
  "description" VARCHAR(2000) NOT NULL,
  "target_type" VARCHAR(32),
  "target_id" VARCHAR(64),
  "image_url" VARCHAR(500),
  "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reports_reporter_id_created_at_idx" ON "reports"("reporter_id", "created_at" DESC);
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at" DESC);

ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey"
  FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
