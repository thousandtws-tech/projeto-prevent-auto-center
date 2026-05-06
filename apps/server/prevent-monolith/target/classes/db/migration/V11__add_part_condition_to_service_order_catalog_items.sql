ALTER TABLE service_order_catalog_items
    ADD COLUMN IF NOT EXISTS part_condition VARCHAR(20);

UPDATE service_order_catalog_items
SET part_condition = 'new'
WHERE type = 'part'
  AND (part_condition IS NULL OR BTRIM(part_condition) = '');
