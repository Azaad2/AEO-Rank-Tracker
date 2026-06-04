import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/logo-light.png';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

export default function ResetPassword() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session via URL hash; listen for it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
        setChecking(false);
      }
    });

    // Also check immediately for an existing recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
      // Parse hash for error info
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const errCode = params.get('error_code') || params.get('error');
      const errDesc = params.get('error_description');
      if (errCode) {
        if (errCode.includes('expired') || errDesc?.includes('expired')) {
          setLinkError('This reset link has expired. Please request a new one.');
        } else if (errCode.includes('invalid') || errDesc?.includes('invalid')) {
          setLinkError('This reset link is invalid. Please request a new one.');
        } else {
          setLinkError(errDesc || 'Reset link could not be verified.');
        }
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse({ password, confirm });
    if (!result.success) {
      const fe: typeof errors = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'password') fe.password = err.message;
        if (err.path[0] === 'confirm') fe.confirm = err.message;
      });
      setErrors(fe);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrors({ form: error.message || 'Could not update password. The link may have expired.' });
      return;
    }

    setDone(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-24 p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="AI Mention You" className="h-10 w-10" />
              <span className="text-white text-sm">AI Visibility</span>
            </Link>
          </div>

          <Card className="w-full bg-gray-900 border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white">Set a new password</CardTitle>
              <CardDescription className="text-gray-400">
                Choose a strong password you haven't used before.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checking ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
                </div>
              ) : linkError || !hasSession ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-md bg-red-900/50 border border-red-700 text-red-300 text-sm">
                    {linkError || 'No active reset session. Please request a new password reset link.'}
                  </div>
                  <Link to="/forgot-password">
                    <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                      Request a new link
                    </Button>
                  </Link>
                </div>
              ) : done ? (
                <div className="flex items-start gap-3 p-4 rounded-md bg-green-900/30 border border-green-700 text-green-200 text-sm">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>Password updated. Redirecting you to your dashboard…</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errors.form && (
                    <div className="p-3 rounded-md bg-red-900/50 border border-red-700 text-red-300 text-sm">
                      {errors.form}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">New password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="password"
                        type={show ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="new-password"
                        className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-gray-300">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="confirm"
                        type={show ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={loading}
                        autoComplete="new-password"
                        className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                      />
                    </div>
                    {errors.confirm && <p className="text-red-400 text-xs">{errors.confirm}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
                    ) : (
                      'Update password'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
