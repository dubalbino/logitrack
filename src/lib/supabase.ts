import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ycnnjxkgshodzdmaswjq.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljbm5qeGtnc2hvZHpkbWFzd2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjA0OTMsImV4cCI6MjA3OTY5NjQ5M30.ow71AesiCmMUVRRfBw2NCkRu3H9bdOSA95HmXgL6TAY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
