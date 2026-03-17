const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl?.includes('placeholder') &&
  supabaseAnonKey !== 'placeholder-key';

export const SUPABASE_TABLES = {
  clients: 'clients',
  engagements: 'audit_engagements',
  compliance: 'compliance_records',
} as const;
