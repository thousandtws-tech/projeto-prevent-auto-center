ALTER TABLE scheduling_appointments
    ADD COLUMN IF NOT EXISTS mechanic_responsible VARCHAR(120),
    ADD COLUMN IF NOT EXISTS service_order_id BIGINT,
    ADD COLUMN IF NOT EXISTS service_order_number VARCHAR(40);

CREATE INDEX IF NOT EXISTS idx_scheduling_appointments_workshop_mechanic
    ON scheduling_appointments (workshop_id, LOWER(mechanic_responsible));

CREATE INDEX IF NOT EXISTS idx_scheduling_appointments_workshop_service_order_id
    ON scheduling_appointments (workshop_id, service_order_id);
