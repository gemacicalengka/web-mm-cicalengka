import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eoxhqbyywfxaualkhnjq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVveGhxYnl5d2Z4YXVhbGtobmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzU0NTcsImV4cCI6MjA3NDIxMTQ1N30.Qamd1fJ8QvMHefj98FubuJcejHWuUr6Cv--GtB4ceyU";

export const supabase = createClient(supabaseUrl, supabaseKey);
