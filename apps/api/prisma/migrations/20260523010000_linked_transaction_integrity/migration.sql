-- Apply linked-transaction integrity in databases that already recorded the repaired migration as applied.
DROP INDEX IF EXISTS "Transaction_userId_sourceType_sourceId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_userId_sourceType_sourceId_date_key"
ON "Transaction"("userId", "sourceType", "sourceId", "date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_clientId_fkey'
  ) THEN
    ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_subscriptionId_fkey'
  ) THEN
    ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
