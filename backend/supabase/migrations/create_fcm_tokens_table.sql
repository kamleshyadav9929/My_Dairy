-- FCM Tokens table for storing Firebase push notification tokens
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, token)
);

-- Index for faster lookup by customer
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_customer_id ON fcm_tokens(customer_id);

-- Index for active tokens
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active) WHERE is_active = true;
