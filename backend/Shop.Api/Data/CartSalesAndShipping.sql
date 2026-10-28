-- Apply once to the existing PostgreSQL Shop database before deploying the updated API.
-- NULL means the product is not on sale. Existing regular prices and historical order items are unchanged.
ALTER TABLE "Products"
    ADD COLUMN IF NOT EXISTS "SalePrice" numeric(10,2) NULL;

-- Keep existing sale prices safe if this script is re-run after manual edits.
UPDATE "Products"
SET "SalePrice" = NULL
WHERE "SalePrice" IS NOT NULL AND "SalePrice" >= "Price";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CK_Products_SalePrice_LessThan_Price'
    ) THEN
        ALTER TABLE "Products"
            ADD CONSTRAINT "CK_Products_SalePrice_LessThan_Price"
            CHECK ("SalePrice" IS NULL OR "SalePrice" < "Price");
    END IF;
END $$;
