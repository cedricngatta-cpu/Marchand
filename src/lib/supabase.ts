import { createClient } from '@supabase/supabase-js';

// URL de repli et clé anon factice pour permettre au build statique de se terminer sans crash de la bibliothèque
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Supabase credentials missing. Data persistence will be limited.');
    }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
