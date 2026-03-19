import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthRedirectUrl, isSupabaseConfigured } from '@/lib/appConfig';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user, authLoading]);

  // Handle email confirmation redirect from Supabase
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Wait a moment for AuthContext to process the session
      const timer = setTimeout(() => {
        if (!authLoading) {
          // Session should be set by now, redirect will happen via above useEffect
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;
    
    if (!normalizedEmail || !normalizedPassword) {
      toast({ title: 'Error', description: 'Please enter both email and password.', variant: 'destructive' });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: 'Supabase Not Configured',
        description: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: normalizedPassword,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
          },
        });
        if (error) throw error;
        if (data.session) {
          toast({ title: 'Success', description: 'Account created and logged in successfully.' });
          navigate('/dashboard', { replace: true });
          return;
        }

        toast({
          title: 'Check your email! ✉️',
          description: 'We sent a confirmation link. Click it to complete signup and access your dashboard.',
        });
        setIsSignUp(false);
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        });
        if (error) throw error;
        toast({ title: 'Welcome back!', description: 'Logged in successfully from Supabase.' });
        navigate('/dashboard', { replace: true });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      toast({ title: 'Authentication Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    const isConfirmingEmail = window.location.hash.includes('access_token');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-grid">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-background/70 px-6 py-4 shadow-xl backdrop-blur-xl">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {isConfirmingEmail ? 'Confirming your email...' : 'Checking your Supabase session...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background bg-grid">
      <div className="w-full max-w-md p-8 rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg mb-4">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-center">
            {isSignUp ? 'Create Auditor Workspace' : 'Welcome to AuditEase'}
          </h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            {isSignUp ? 'Sign up to manage audit engagements, compliance reviews, and client records' : 'Log in to access your auditor dashboard in real time'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm font-medium text-destructive">Supabase configuration is missing</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your local `.env` file, then restart the app.
            </p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {!isSignUp && (
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              )}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" className="w-full h-11 mt-6" disabled={loading || !isSupabaseConfigured}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary-foreground" />
            ) : (
              isSignUp ? 'Sign Up' : 'Log In'
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-1 text-primary hover:underline font-medium"
              disabled={loading}
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
