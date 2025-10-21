import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fsbrpkdobnnivcnujodo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYnJwa2RvYm5uaXZjbnVqb2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTE3OTEsImV4cCI6MjA3NjQ4Nzc5MX0.kF_-Ax1LixfAKWWLRgOPNhUprVab9xQPG4v9VjE1RmY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
