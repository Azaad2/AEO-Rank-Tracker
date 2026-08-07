import { Twitter, Linkedin, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
}

export const ShareButtons = ({ title }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`${title} - Check out this article!`);
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

  const btnClass =
    "gap-2 bg-gray-900 border-gray-700 text-white hover:bg-gray-800 hover:text-yellow-400";

  return (
    <div className="mt-12 pt-8 border-t border-gray-800">
      <h4 className="font-semibold mb-4 text-white">Share this article</h4>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={shareOnTwitter}
          className={btnClass}
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={shareOnLinkedIn}
          className={btnClass}
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copyLink}
          className={btnClass}
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

    </div>
  );
};

export default ShareButtons;
