/*
# Personal Finance Manager — Database Schema

## Overview
Creates the full schema for a multi-user personal finance manager app.

## New Tables
1. `profiles` — Extends auth.users with per-user settings (currency, default month, custom categories).
   - `id` (uuid, PK, references auth.users) — one row per user, same ID as auth user.
   - `name` (text) — display name.
   - `email` (text) — email (kept in sync for display).
   - `currency` (text, default '$') — currency symbol used across the app.
   - `default_month` (text, default 'current') — 'current' or a specific month like '2026-01'.
   - `created_at` (timestamptz).

2. `categories` — User-specific categories for transactions.
   - `id` (uuid, PK).
   - `user_id` (uuid, references auth.users, defaults to auth.uid()).
   - `name` (text) — category name.
   - `created_at` (timestamptz).

3. `transactions` — Financial transactions (income or expense).
   - `id` (uuid, PK).
   - `user_id` (uuid, references auth.users, defaults to auth.uid()).
   - `description` (text) — what the transaction is for.
   - `amount` (numeric) — positive for income, negative for expense.
   - `category` (text) — category name (denormalized for simplicity).
   - `date` (date) — the transaction date.
   - `created_at` (timestamptz).

## Security (RLS)
- All tables have RLS enabled.
- All tables are owner-scoped: each authenticated user can only read/write their own rows.
- Owner columns default to auth.uid() so inserts from the client work without passing user_id.
- 4 separate policies (SELECT, INSERT, UPDATE, DELETE) per table, scoped TO authenticated.

## Notes
1. Profiles table uses auth.uid() as the primary key, matching auth.users IDs.
2. Categories are per-user; each user starts with a default set seeded from the frontend on first login.
3. Transactions store the category name as text (denormalized) so historical transactions remain readable even if a category is renamed or deleted.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT '$',
  default_month text NOT NULL DEFAULT 'current',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_categories" ON categories;
CREATE POLICY "select_own_categories" ON categories
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_categories" ON categories;
CREATE POLICY "insert_own_categories" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_categories" ON categories;
CREATE POLICY "update_own_categories" ON categories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_categories" ON categories;
CREATE POLICY "delete_own_categories" ON categories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Index for sorting transactions by date within a user
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);