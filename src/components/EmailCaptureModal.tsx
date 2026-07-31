import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { Loader2, Lock, FileText, CheckCircle2, RefreshCw, Copy, Check } from "lucide-react";

// Google-style suggested password: readable alphanumeric, easy to store
function generatePassword() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}


interface EmailCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (email: string) => void;
  scanId?: string;
  domain: string;
  score: number;
}

export function EmailCaptureModal({
  open,
  onOpenChange,
  onSuccess,
  scanId,
  domain,
  score,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { trackEvent } = useActivityTracking();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters, or keep the suggested one.",
        variant: "destructive",
      });
      return;
    }


    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // Save email to customers table (non-blocking on duplicates)
      const { error: customerError } = await supabase.from("customers").insert({
        email: cleanEmail,
        scan_id: scanId || null,
      });
      if (customerError) console.error("customer insert failed:", customerError);

      // Track email capture
      trackEvent("email_captured", {
        domain,
        score,
        scan_id: scanId,
      });

      // Create the account (profile is created automatically) and sign in
      const { error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });

      if (signUpError) {
        // Existing account — try signing them in with the given password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) {
          toast({
            title: "You already have an account",
            description: "Please log in with your existing password to continue.",
            variant: "destructive",
          });
          onOpenChange(false);
          navigate("/auth");
          return;
        }
      }

      // Fire-and-forget scan complete email — don't block UX if it fails
      supabase.functions
        .invoke("send-scan-complete", {
          body: {
            email: cleanEmail,
            domain,
            score,
            scanId: scanId || null,
          },
        })
        .catch((err) => console.error("send-scan-complete invoke failed:", err));

      if (scanId) {
        try { localStorage.setItem("pendingScanId", scanId); } catch {}
      }

      toast({
        title: "You're in!",
        description: "Your account is ready — taking you to your dashboard.",
      });

      onSuccess(cleanEmail);
      onOpenChange(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Email capture error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-primary" />
            Unlock Your Full Report
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Create your free account to open the full AI visibility analysis for <span className="font-medium text-foreground">{domain}</span> in your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits list */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span>View all prompt results (not just the first 2)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span>Access your personalized improvement roadmap</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span>Download detailed CSV report with recommendations</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Get our $9 Premium PDF Guide (optional)</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {!showPassword ? (
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <p className="font-medium">We'll create a secure password for you</p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">{password}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setPassword(generatePassword())} aria-label="Suggest a new password">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={copyPassword} aria-label="Copy password">
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setShowPassword(true)}
                >
                  Set my own password instead
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="capture-password">Choose a password</Label>
                <Input
                  id="capture-password"
                  type="text"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => { setPassword(generatePassword()); setShowPassword(false); }}
                >
                  Use a suggested password
                </button>
              </div>
            )}


            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your dashboard...
                </>
              ) : (
                "Unlock Full Results"
              )}
            </Button>


            <p className="text-xs text-center text-muted-foreground">
              No spam. We'll only email you about improving your AI visibility.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
