import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-light.png';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const { user, isLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (email: string, password: string) => {
    if (mode === 'signin') {
      const result = await signIn(email, password);
      if (!result.error) {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        navigate('/dashboard');
      }
      return result;
    } else {
      const result = await signUp(email, password);
      if (!result.error) {
        toast({
          title: "Account created!",
          description: "Welcome! Redirecting to your dashboard.",
        });
        navigate('/dashboard');
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
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                AI Visibility
              </span>
            </Link>
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
