import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fwdqwqodioduwmieagbs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZHF3cW9kaW9kdXdtaWVhZ2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMzE0ODQsImV4cCI6MjA2MDgwNzQ4NH0.luJKDbRVLe4w1pK9DYMycbBlEOzMCzqr9V7rNlcBHE4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
