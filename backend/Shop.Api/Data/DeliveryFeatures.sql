-- Apply once to an existing PostgreSQL Shop database before deploying the updated API.
-- Existing orders remain valid; old rows receive safe defaults.
ALTER TABLE "Orders"
    ADD COLUMN IF NOT EXISTS "DeliveryMethod" character varying(20) NOT NULL DEFAULT 'Delivery',
    ADD COLUMN IF NOT EXISTS "PhoneNumber" character varying(30) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS "Subcity" character varying(100),
    ADD COLUMN IF NOT EXISTS "Woreda" character varying(100),
    ADD COLUMN IF NOT EXISTS "Landmark" character varying(200),
    ADD COLUMN IF NOT EXISTS "Directions" character varying(500),
    ADD COLUMN IF NOT EXISTS "MapUrl" character varying(1000),
    ADD COLUMN IF NOT EXISTS "RegionalCity" character varying(100),
    ADD COLUMN IF NOT EXISTS "DeliveryFee" numeric(10,2) NOT NULL DEFAULT 0;

-- Allow a landmark plus delivery instructions in the composed address.
ALTER TABLE "Orders" ALTER COLUMN "ShippingAddress" TYPE character varying(1000);
