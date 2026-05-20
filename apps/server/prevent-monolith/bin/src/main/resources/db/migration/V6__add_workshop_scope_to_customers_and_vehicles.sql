ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS workshop_id BIGINT;

UPDATE customers
SET workshop_id = 0
WHERE workshop_id IS NULL;

ALTER TABLE customers
    ALTER COLUMN workshop_id SET NOT NULL;

ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS uq_customers_cpf_cnpj;

ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS uq_customers_email;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_workshop_cpf_cnpj
    ON customers (workshop_id, cpf_cnpj);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_workshop_email
    ON customers (workshop_id, email);

CREATE INDEX IF NOT EXISTS idx_customers_workshop_created_at
    ON customers (workshop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_workshop_nome_completo_lower
    ON customers (workshop_id, LOWER(nome_completo));

CREATE INDEX IF NOT EXISTS idx_customers_workshop_telefone
    ON customers (workshop_id, telefone);

ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS workshop_id BIGINT;

UPDATE vehicles
SET workshop_id = 0
WHERE workshop_id IS NULL;

ALTER TABLE vehicles
    ALTER COLUMN workshop_id SET NOT NULL;

ALTER TABLE vehicles
    DROP CONSTRAINT IF EXISTS uq_vehicles_placa;

ALTER TABLE vehicles
    DROP CONSTRAINT IF EXISTS uq_vehicles_chassi;

CREATE UNIQUE INDEX IF NOT EXISTS uq_vehicles_workshop_placa
    ON vehicles (workshop_id, placa);

CREATE UNIQUE INDEX IF NOT EXISTS uq_vehicles_workshop_chassi
    ON vehicles (workshop_id, chassi);

CREATE INDEX IF NOT EXISTS idx_vehicles_workshop_placa
    ON vehicles (workshop_id, placa);

CREATE INDEX IF NOT EXISTS idx_vehicles_workshop_chassi
    ON vehicles (workshop_id, chassi);

CREATE INDEX IF NOT EXISTS idx_vehicles_workshop_marca
    ON vehicles (workshop_id, marca);

CREATE INDEX IF NOT EXISTS idx_vehicles_workshop_ano
    ON vehicles (workshop_id, ano);
