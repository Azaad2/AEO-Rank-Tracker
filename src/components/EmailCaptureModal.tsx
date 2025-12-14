import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { Loader2, Lock, FileText, CheckCircle2 } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { trackEvent } = useActivityTracking();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

    setIsSubmitting(true);

    try {
      // Save email to customers table
      const { error } = await supabase.from("customers").insert({
        email: email.trim().toLowerCase(),
        scan_id: scanId || null,
      });

      if (error) throw error;

      // Track email capture
      trackEvent("email_captured", {
        domain,
        score,
        scan_id: scanId,
      });

      toast({
        title: "Access unlocked!",
        description: "You now have full access to your scan results.",
      });

      onSuccess(email);
      onOpenChange(false);
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
            Enter your email to view the complete AI visibility analysis for <span className="font-medium text-foreground">{domain}</span>
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

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlocking...
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
