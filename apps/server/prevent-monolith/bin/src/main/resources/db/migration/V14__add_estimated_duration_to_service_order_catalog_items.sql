ALTER TABLE service_order_catalog_items
    ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

UPDATE service_order_catalog_items
SET estimated_duration_minutes = 60
WHERE type = 'labor'
  AND estimated_duration_minutes IS NULL;
