CREATE TABLE IF NOT EXISTS service_order_catalog_items (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    code VARCHAR(60),
    description VARCHAR(160) NOT NULL,
    default_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_order_catalog_items_workshop_type
    ON service_order_catalog_items (workshop_id, type, description);

CREATE INDEX IF NOT EXISTS idx_service_order_catalog_items_workshop_status
    ON service_order_catalog_items (workshop_id, status);
