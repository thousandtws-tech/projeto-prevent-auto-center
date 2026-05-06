CREATE TABLE IF NOT EXISTS scheduling_appointments (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL,
    status VARCHAR(40) NOT NULL,
    customer_id BIGINT,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(40) NOT NULL,
    customer_email VARCHAR(160),
    vehicle_model VARCHAR(120) NOT NULL,
    vehicle_plate VARCHAR(20),
    service_type VARCHAR(120) NOT NULL,
    notes TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    integration_provider VARCHAR(80) NOT NULL,
    integration_last_attempt_at TIMESTAMPTZ,
    integration_last_error TEXT,
    integration_event_id VARCHAR(255),
    integration_event_link TEXT,
    integration_response_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduling_appointments_workshop_start_at
    ON scheduling_appointments (workshop_id, start_at ASC);

CREATE INDEX IF NOT EXISTS idx_scheduling_appointments_workshop_status
    ON scheduling_appointments (workshop_id, status);

CREATE INDEX IF NOT EXISTS idx_scheduling_appointments_workshop_customer_name
    ON scheduling_appointments (workshop_id, LOWER(customer_name));

CREATE INDEX IF NOT EXISTS idx_scheduling_appointments_workshop_service_type
    ON scheduling_appointments (workshop_id, service_type);

CREATE INDEX IF NOT EXISTS idx_scheduling_appointments_workshop_created_at
    ON scheduling_appointments (workshop_id, created_at DESC);
