import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LockedOverlayProps {
  onUnlock: () => void;
  message?: string;
}

export function LockedOverlay({ onUnlock, message = "Enter your email to unlock" }: LockedOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
      <div className="text-center space-y-3 p-6">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
        <Button onClick={onUnlock} variant="default" size="sm">
          Unlock Full Report
        </Button>
      </div>
    </div>
  );
}
