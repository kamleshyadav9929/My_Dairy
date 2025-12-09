-- Create AMCU logs table for tracking raw data from AMCU machine
CREATE TABLE IF NOT EXISTS amcu_logs (
    id SERIAL PRIMARY KEY,
    raw_text TEXT,
    parsed_ok BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_amcu_logs_created_at ON amcu_logs(created_at DESC);
