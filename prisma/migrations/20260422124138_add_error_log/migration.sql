-- Add ErrorLog for in-app diagnostics

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ErrorSource') THEN
    CREATE TYPE "ErrorSource" AS ENUM ('SERVER', 'CLIENT', 'ACTION', 'API');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ErrorLog" (
  "id" TEXT NOT NULL,
  "requestId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" "ErrorSource" NOT NULL,
  "status" INTEGER,
  "route" TEXT,
  "method" TEXT,
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "userId" TEXT,
  "workspaceId" TEXT,
  "userAgent" TEXT,
  "context" JSONB,

  CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ErrorLog_occurredAt_idx" ON "ErrorLog"("occurredAt" DESC);
CREATE INDEX IF NOT EXISTS "ErrorLog_status_idx" ON "ErrorLog"("status");
CREATE INDEX IF NOT EXISTS "ErrorLog_workspaceId_occurredAt_idx" ON "ErrorLog"("workspaceId", "occurredAt" DESC);
