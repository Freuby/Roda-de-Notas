import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tmzrcuxzipzjakbilnmj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtenJjdXh6aXB6amFrYmlsbm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NjU1MzYsImV4cCI6MjA1MjQ0MTUzNn0.cQjFnuX6pOJ_-zR0TSSoPPcflIpOccr1fY622YwRUzo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});