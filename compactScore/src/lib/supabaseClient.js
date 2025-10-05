const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_KEY not set. Some operations will fail until environment variables are provided.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
