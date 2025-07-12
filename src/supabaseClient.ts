import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase values
const supabaseUrl = 'https://hnjimrxkdnwqmejvjzgn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuamltcnhrZG53cW1lanZqemduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3ODI0NjgsImV4cCI6MjA2NTM1ODQ2OH0.5addfUa-b3jKYyvSuhPUNYtiFQlqk0_FhAPL-tCSByY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
