const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = import.meta.env.VITE_SITE_URL;
const authRedirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl?.includes('placeholder') &&
  supabaseAnonKey !== 'placeholder-key';

export const getAppUrl = () => {
  if (siteUrl) return siteUrl;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

export const getAuthRedirectUrl = () => {
  if (authRedirectUrl) return authRedirectUrl;
  return `${getAppUrl()}/auth`;
};

export const SUPABASE_TABLES = {
  clients: 'clients',
  engagements: 'audit_engagements',
  compliance: 'compliance_records',
} as const;
