-- Supabase Database Cleanup Script
-- WARNING: This script will delete ALL data in your database
-- Use with caution as this action cannot be undone

-- Drop all tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.invoice_items;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS auth.users;

-- Drop any functions
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Clean up any leftover sequences
DROP SEQUENCE IF EXISTS public.clients_id_seq;
DROP SEQUENCE IF EXISTS public.invoices_id_seq;
DROP SEQUENCE IF EXISTS public.invoice_items_id_seq;
DROP SEQUENCE IF EXISTS public.payments_id_seq;
