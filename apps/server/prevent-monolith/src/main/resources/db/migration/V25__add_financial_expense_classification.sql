ALTER TABLE financial_transactions
    ADD COLUMN IF NOT EXISTS expense_classification VARCHAR(20);

UPDATE financial_transactions
SET expense_classification = 'variable'
WHERE type = 'expense'
  AND (expense_classification IS NULL OR TRIM(expense_classification) = '');

CREATE INDEX IF NOT EXISTS idx_financial_transactions_workshop_expense_classification
    ON financial_transactions (workshop_id, expense_classification);
s