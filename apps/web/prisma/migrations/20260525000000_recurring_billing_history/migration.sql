ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY';
UPDATE "Subscription" SET "billingCycle" = "cycle" WHERE "billingCycle" IS NULL OR "billingCycle" = '';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';
UPDATE "Transaction" SET "name" = COALESCE(NULLIF("name", ''), NULLIF("notes", ''), "sourceType") WHERE "name" = '';
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "sourceBillingDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Transaction_sourceBillingDate_idx" ON "Transaction"("sourceBillingDate");

CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_generated_source_billing_date_key"
ON "Transaction"("userId", "sourceType", "sourceId", "sourceBillingDate")
WHERE "sourceBillingDate" IS NOT NULL AND "sourceType" <> 'manual';
