import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// NOTA: O 'react-native-url-polyfill' é importado aqui para garantir a compatibilidade
// do Supabase Auth, especialmente em ambientes que podem simular React Native,
// como indicado pelas dependências do seu projeto.

// Obtenha a URL e a Chave Anônima do Supabase a partir das variáveis de ambiente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação para garantir que as variáveis de ambiente foram configuradas.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem ser definidas no seu arquivo .env");
}

// Crie e exporte o cliente Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Para aplicações web, o localStorage é o padrão e funciona bem.
    // Se este código for usado em React Native, você pode precisar trocar por um AsyncStorage customizado.
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});