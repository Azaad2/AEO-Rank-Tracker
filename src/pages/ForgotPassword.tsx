import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/logo-light.png';

const emailSchema = z.string().email('Please enter a valid email address');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message || 'Could not send reset email. Please try again.');
      return;
    }

    setSent(true);
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
              <CardTitle className="text-xl text-white">
                {sent ? 'Check your email' : 'Reset your password'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {sent
                  ? "We've sent you a password reset link."
                  : "Enter your email and we'll send you a link to reset your password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-md bg-green-900/30 border border-green-700 text-green-200 text-sm">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      Check your email for a password reset link. The link expires in 1 hour.
                    </div>
                  </div>
                  <Button
                    onClick={() => { setSent(false); setEmail(''); }}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Send to a different email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-md bg-red-900/50 border border-red-700 text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                        className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                    ) : (
                      'Send reset link'
                    )}
                  </Button>
                </form>
              )}

              <div className="text-center mt-6">
                <Link to="/auth" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-sm">
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
