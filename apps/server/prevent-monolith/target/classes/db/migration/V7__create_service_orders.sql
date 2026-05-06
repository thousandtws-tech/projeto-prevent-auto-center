CREATE TABLE IF NOT EXISTS service_orders (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL,
    status VARCHAR(40) NOT NULL,
    order_number VARCHAR(40) NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    payload_json TEXT NOT NULL,
    signature_token VARCHAR(120),
    signature_link TEXT,
    signature_status VARCHAR(40),
    signer_name VARCHAR(120),
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_orders_workshop_created_at
    ON service_orders (workshop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_orders_workshop_updated_at
    ON service_orders (workshop_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_orders_workshop_order_number
    ON service_orders (workshop_id, order_number);

CREATE INDEX IF NOT EXISTS idx_service_orders_workshop_customer_name
    ON service_orders (workshop_id, LOWER(customer_name));

CREATE INDEX IF NOT EXISTS idx_service_orders_workshop_status
    ON service_orders (workshop_id, status);

CREATE INDEX IF NOT EXISTS idx_service_orders_workshop_signature_status
    ON service_orders (workshop_id, signature_status);

CREATE UNIQUE INDEX IF NOT EXISTS uk_service_orders_signature_token
    ON service_orders (signature_token)
    WHERE signature_token IS NOT NULL;
