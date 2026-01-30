import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, ArrowUpRight } from "lucide-react";

interface SubscriptionStatusProps {
  planName: string;
  promptsUsed: number;
  promptsLimit: number;
  scansUsed: number;
  scansLimit: number;
  showUpgrade?: boolean;
  compact?: boolean;
}

export function SubscriptionStatus({
  planName,
  promptsUsed,
  promptsLimit,
  scansUsed,
  scansLimit,
  showUpgrade = true,
  compact = false,
}: SubscriptionStatusProps) {
  const promptsPercentage = promptsLimit > 0 ? Math.min(100, (promptsUsed / promptsLimit) * 100) : 0;
  const scansPercentage = scansLimit > 0 ? Math.min(100, (scansUsed / scansLimit) * 100) : 0;
  const isUnlimitedScans = scansLimit === -1;

  const isNearLimit = promptsPercentage >= 80 || scansPercentage >= 80;
  const isAtLimit = promptsPercentage >= 100 || scansPercentage >= 100;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          <Zap className="w-3 h-3 mr-1" />
          {planName}
        </Badge>
        <span className="text-muted-foreground">
          {promptsUsed}/{promptsLimit} prompts
        </span>
        {planName === "Free" && showUpgrade && (
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
            <Link to="/pricing">
              Upgrade
              <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Zap className="w-3 h-3 mr-1" />
            {planName} Plan
          </Badge>
        </div>
        {showUpgrade && planName !== "Agency" && (
          <Button variant="outline" size="sm" className="text-primary hover:bg-primary/10" asChild>
            <Link to="/pricing">
              Upgrade
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* Prompts Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Prompts</span>
            <span className={`font-medium ${isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-500" : "text-foreground"}`}>
              {promptsUsed}/{promptsLimit}
            </span>
          </div>
          <Progress 
            value={promptsPercentage} 
            className={`h-2 ${isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-yellow-500" : ""}`}
          />
        </div>

        {/* Scans Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Scans</span>
            <span className={`font-medium ${
              isUnlimitedScans 
                ? "text-foreground" 
                : scansPercentage >= 100 
                  ? "text-destructive" 
                  : scansPercentage >= 80 
                    ? "text-yellow-500" 
                    : "text-foreground"
            }`}>
              {isUnlimitedScans ? `${scansUsed} / ∞` : `${scansUsed}/${scansLimit}`}
            </span>
          </div>
          {!isUnlimitedScans && (
            <Progress 
              value={scansPercentage} 
              className={`h-2 ${
                scansPercentage >= 100 
                  ? "[&>div]:bg-destructive" 
                  : scansPercentage >= 80 
                    ? "[&>div]:bg-yellow-500" 
                    : ""
              }`}
            />
          )}
        </div>
      </div>

      {isAtLimit && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm">
          <p className="text-destructive font-medium">You've reached your plan limit</p>
          <p className="text-muted-foreground mt-1">
            Upgrade to continue scanning or wait for your limit to reset.
          </p>
        </div>
      )}
    </div>
  );
}
