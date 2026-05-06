CREATE TABLE backup_settings (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL UNIQUE REFERENCES workshops (id) ON DELETE CASCADE,
    automatic_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_days VARCHAR(120) NOT NULL,
    schedule_time VARCHAR(10) NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    last_automatic_execution_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backup_settings_automatic_enabled
    ON backup_settings (automatic_enabled);

CREATE TABLE backup_runs (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL REFERENCES workshops (id) ON DELETE CASCADE,
    trigger_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    created_by_user_id BIGINT REFERENCES auth_users (id) ON DELETE SET NULL,
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    checksum_sha256 VARCHAR(128),
    storage_path VARCHAR(500),
    error_message TEXT
);

CREATE INDEX idx_backup_runs_workshop_started_at
    ON backup_runs (workshop_id, started_at DESC);

CREATE INDEX idx_backup_runs_workshop_status_completed_at
    ON backup_runs (workshop_id, status, completed_at DESC);
