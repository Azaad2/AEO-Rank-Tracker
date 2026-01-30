import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, ArrowRight } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  limitType: "prompts" | "scans" | "feature";
  featureName?: string;
}

const upgradeBenefits = {
  prompts: [
    "50 prompts per month (10x more)",
    "Full AI visibility results",
    "CSV export for reporting",
    "Slack alerts for mentions",
  ],
  scans: [
    "10 scans per month",
    "Track multiple domains",
    "Historical scan data",
    "Priority processing",
  ],
  feature: [
    "Unlock all premium features",
    "API access for automation",
    "White-label reports",
    "Priority support",
  ],
};

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  limitType,
  featureName,
}: UpgradeModalProps) {
  const benefits = upgradeBenefits[limitType];

  const getTitle = () => {
    switch (limitType) {
      case "prompts":
        return "You've Used All Your Prompts";
      case "scans":
        return "You've Reached Your Scan Limit";
      case "feature":
        return `${featureName} is a Pro Feature`;
      default:
        return "Upgrade to Continue";
    }
  };

  const getDescription = () => {
    switch (limitType) {
      case "prompts":
        return "Upgrade to Pro for 50 prompts per month and unlock all AI visibility insights.";
      case "scans":
        return "Upgrade to Pro for 10 scans per month and track your AI visibility regularly.";
      case "feature":
        return `${featureName} is available on Pro and higher plans. Upgrade to unlock this feature.`;
      default:
        return "Upgrade your plan to access more features and higher limits.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl text-foreground">{getTitle()}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Current Plan:</span>
            <Badge variant="outline">{currentPlan}</Badge>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-foreground">Pro Plan</span>
              <span className="text-2xl font-bold text-primary">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
            </div>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
            asChild
          >
            <Link to="/pricing" onClick={onClose}>
              View All Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            14-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
