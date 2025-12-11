-- Fix foreign key constraint on password_reset_requests table
-- This allows deleting customers without constraint violations

-- First, delete all existing password_reset_requests (they're temporary anyway)
DELETE FROM password_reset_requests;

-- Drop the existing foreign key constraint
ALTER TABLE password_reset_requests 
DROP CONSTRAINT IF EXISTS password_reset_requests_customer_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE password_reset_requests
ADD CONSTRAINT password_reset_requests_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
