import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use SUPABASE_SECRET_KEY first (standard in some setups), then SUPABASE_SERVICE_ROLE_KEY, then fallback to SUPABASE_PUBLISHABLE_KEY if needed.
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const isPlaceholder = !supabaseUrl || supabaseUrl === 'your_supabase_url' || supabaseUrl === '';
const clientUrl = isPlaceholder ? 'https://placeholder.supabase.co' : supabaseUrl;
const clientKey = !supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key' || supabaseServiceKey === ''
  ? 'placeholder-key' 
  : supabaseServiceKey;

if (isPlaceholder || clientKey === 'placeholder-key') {
  console.warn('Warning: Supabase credentials are not properly set in environment variables. Using placeholder values.');
}

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: false,
  }
});
