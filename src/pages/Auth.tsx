import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-light.png';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  // Honor a pending guest scan so users land in their fresh report after signup
  const pendingScanId = typeof window !== 'undefined' ? localStorage.getItem('pendingScanId') : null;
  const baseRedirect = searchParams.get('redirect') || '/dashboard';
  const redirectTo = pendingScanId
    ? `/dashboard?tab=recommendations&scanId=${encodeURIComponent(pendingScanId)}`
    : baseRedirect;
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, isLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Google sign-in failed',
        description: error.message,
        variant: 'destructive',
      });
      setGoogleLoading(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, isLoading, navigate, redirectTo]);

  const handleSubmit = async (email: string, password: string) => {
    if (mode === 'signin') {
      const result = await signIn(email, password);
      if (!result.error) {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        navigate(redirectTo);
      }
      return result;
    } else {
      const result = await signUp(email, password);
      if (!result.error) {
        toast({
          title: "Account created!",
          description: "Welcome! Let's get you set up.",
        });
        navigate(redirectTo);
      }
      return result;
    }
  };


  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-24 p-4 md:p-8">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="AI Visibility Checker" className="h-10 w-10" />
              <span 
                className="text-white text-sm"
              >
                AI Visibility
              </span>
            </Link>
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full bg-white hover:bg-gray-100 text-black font-semibold mb-4 h-11"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="ml-2">Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-black text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Auth Form */}
          <AuthForm
            mode={mode}
            onSubmit={handleSubmit}
            onToggleMode={toggleMode}
            isLoading={isLoading}
          />

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
