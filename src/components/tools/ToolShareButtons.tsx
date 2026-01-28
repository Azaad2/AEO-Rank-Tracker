import { Twitter, Linkedin, Link2, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ToolShareButtonsProps {
  toolName: string;
  description?: string;
}

export const ToolShareButtons = ({ toolName, description }: ToolShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const shareText = description 
    ? `Check out this free ${toolName} tool! ${description}`
    : `I just discovered this free ${toolName} tool - it's amazing for tracking AI visibility!`;

  const shareOnTwitter = () => {
    const text = encodeURIComponent(shareText);
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareOnLinkedIn = () => {
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-foreground">Share This Tool</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Found this useful? Help others discover it too!
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={shareOnTwitter}
          className="gap-2 bg-background hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50"
        >
          <Twitter className="h-4 w-4" />
          Share on X
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={shareOnLinkedIn}
          className="gap-2 bg-background hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/50"
        >
          <Linkedin className="h-4 w-4" />
          Share on LinkedIn
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copyLink}
          className="gap-2 bg-background"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>
    </div>
  );
};

export default ToolShareButtons;
