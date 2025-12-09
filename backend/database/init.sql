-- Dairy Management Database Schema
-- SQLite initialization script

-- Users table (for admin authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'customer')),
    username TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    password_hash TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amcu_customer_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    milk_type_default TEXT DEFAULT 'COW' CHECK(milk_type_default IN ('COW', 'BUFFALO', 'MIXED')),
    password_hash TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Milk entries table
CREATE TABLE IF NOT EXISTS milk_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    date DATE NOT NULL,
    time TIME,
    shift TEXT NOT NULL CHECK(shift IN ('M', 'E')),
    milk_type TEXT NOT NULL CHECK(milk_type IN ('COW', 'BUFFALO', 'MIXED')),
    quantity_litre REAL NOT NULL,
    fat REAL,
    snf REAL,
    clr REAL,
    rate_per_litre REAL NOT NULL,
    amount REAL NOT NULL,
    source TEXT DEFAULT 'MANUAL' CHECK(source IN ('AMCU', 'MANUAL')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    date DATE NOT NULL,
    amount REAL NOT NULL,
    mode TEXT DEFAULT 'CASH' CHECK(mode IN ('CASH', 'UPI', 'BANK', 'OTHER')),
    reference TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rate cards table
CREATE TABLE IF NOT EXISTS rate_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milk_type TEXT NOT NULL CHECK(milk_type IN ('COW', 'BUFFALO', 'MIXED')),
    min_fat REAL,
    max_fat REAL,
    min_snf REAL,
    max_snf REAL,
    rate_per_litre REAL NOT NULL,
    effective_from DATE,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AMCU raw logs table (for debugging)
CREATE TABLE IF NOT EXISTS amcu_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_text TEXT NOT NULL,
    parsed_ok INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- News table for customer announcements
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_milk_entries_customer ON milk_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_milk_entries_date ON milk_entries(date);
CREATE INDEX IF NOT EXISTS idx_milk_entries_customer_date ON milk_entries(customer_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_customers_amcu_id ON customers(amcu_customer_id);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('dairy_name', 'My Dairy'),
    ('owner_name', 'Owner'),
    ('address', ''),
    ('default_rate_cow', '30'),
    ('default_rate_buffalo', '40'),
    ('default_rate_mixed', '35');

-- Insert default rate cards
INSERT OR IGNORE INTO rate_cards (id, milk_type, min_fat, max_fat, min_snf, max_snf, rate_per_litre, effective_from, is_active)
VALUES 
    (1, 'COW', 3.0, 4.0, 8.0, 8.5, 28.00, '2024-01-01', 1),
    (2, 'COW', 4.0, 5.0, 8.0, 8.5, 32.00, '2024-01-01', 1),
    (3, 'COW', 5.0, 6.0, 8.5, 9.0, 36.00, '2024-01-01', 1),
    (4, 'BUFFALO', 5.0, 6.0, 8.5, 9.0, 38.00, '2024-01-01', 1),
    (5, 'BUFFALO', 6.0, 7.0, 9.0, 9.5, 45.00, '2024-01-01', 1),
    (6, 'BUFFALO', 7.0, 8.0, 9.0, 9.5, 52.00, '2024-01-01', 1),
    (7, 'MIXED', 4.0, 5.5, 8.0, 9.0, 35.00, '2024-01-01', 1);
