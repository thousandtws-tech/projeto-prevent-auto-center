CREATE TABLE IF NOT EXISTS mechanics (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(40),
    email VARCHAR(160),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mechanics_workshop_status
    ON mechanics (workshop_id, status);

CREATE INDEX IF NOT EXISTS idx_mechanics_workshop_name
    ON mechanics (workshop_id, LOWER(name));

CREATE UNIQUE INDEX IF NOT EXISTS uq_mechanics_workshop_name
    ON mechanics (workshop_id, LOWER(name));

