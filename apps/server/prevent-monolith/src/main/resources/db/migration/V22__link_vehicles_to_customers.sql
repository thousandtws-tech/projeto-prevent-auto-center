ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS customer_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_vehicles_workshop_customer
    ON vehicles (workshop_id, customer_id);
