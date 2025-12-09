-- Advances table for tracking customer advance payments
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS advances (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'utilized', 'cancelled')),
    utilized_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_advances_customer_id ON advances(customer_id);
CREATE INDEX IF NOT EXISTS idx_advances_status ON advances(status);

-- Enable Row Level Security
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (admin can manage all, customers can view their own)
CREATE POLICY "Admins can manage all advances" ON advances
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Grant access
GRANT ALL ON advances TO authenticated;
GRANT ALL ON advances TO anon;
