import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing inside environment variables. Ensure .env.local is configured correctly.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
