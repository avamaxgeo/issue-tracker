import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ypbpiniygbdtolikjgnz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwYnBpbml5Z2JkdG9saWtqZ256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Mzc4MjgsImV4cCI6MjA2NDUxMzgyOH0.rfCQfCWVff6rnokSIKXyC-rAKFJfo7Bu2prwaIJlcKA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 