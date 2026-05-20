ALTER TABLE service_order_catalog_items
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS profit_margin_percent NUMERIC(8, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

UPDATE service_order_catalog_items
SET
    cost_price = 0
WHERE cost_price IS NULL;

UPDATE service_order_catalog_items
SET
    profit_margin_percent = 0
WHERE profit_margin_percent IS NULL;

UPDATE service_order_catalog_items
SET
    stock_quantity = 0
WHERE stock_quantity IS NULL;
