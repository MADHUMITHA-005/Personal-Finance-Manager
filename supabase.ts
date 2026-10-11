import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  name: string;
  email: string;
  currency: string;
  default_month: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
};

export const DEFAULT_CATEGORIES = [
  'Food',
  'Rent',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Salary',
  'Other',
];
