-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL,
  method text NOT NULL,
  reference text,
  notes text,
  user_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Add partial status to invoices
ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoice_status_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoice_status_check
  CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled'));
