import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const availableVars = Object.keys(import.meta.env).join(', ');
  throw new Error(`As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas. Variáveis disponíveis: ${availableVars}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
