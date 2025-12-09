-- Create notifications table for persistent customer notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entry', 'payment', 'advance', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    amount DECIMAL(10, 2),
    entry_date DATE,
    reference_id INTEGER,  -- Link to entry/payment id
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(customer_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Comments
COMMENT ON TABLE notifications IS 'Stores customer notifications for milk entries, payments, and system messages';
COMMENT ON COLUMN notifications.type IS 'Type of notification: entry, payment, advance, or system';
COMMENT ON COLUMN notifications.reference_id IS 'References the original entry or payment ID';
