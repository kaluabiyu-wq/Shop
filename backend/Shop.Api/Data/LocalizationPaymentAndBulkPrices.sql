-- Run against the existing shop database after backing it up.
ALTER TABLE "Orders"
  ADD COLUMN IF NOT EXISTS "PaymentMethod" varchar(30) NOT NULL DEFAULT 'Telebirr',
  ADD COLUMN IF NOT EXISTS "PaymentTransactionId" varchar(100),
  ADD COLUMN IF NOT EXISTS "PaymentProofDataUrl" text,
  ADD COLUMN IF NOT EXISTS "PaymentVerified" boolean NOT NULL DEFAULT false;
