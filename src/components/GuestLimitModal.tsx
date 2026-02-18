import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuestLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestLimitModal({ open, onOpenChange }: GuestLimitModalProps) {
  const navigate = useNavigate();

  const handleSignUp = () => {
    onOpenChange(false);
    navigate('/auth?mode=signup');
  };

  const handleSignIn = () => {
    onOpenChange(false);
    navigate('/auth?mode=signin');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center">
           <UserPlus className="h-8 w-8 text-yellow-400" />
          </div>
          <DialogTitle 
            className="text-xl text-center"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            Sign Up to Scan
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center pt-2">
            Create a free account to scan your domain and track your AI visibility over time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSignUp}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Free Account
          </Button>
          
          <Button
            onClick={handleSignIn}
            variant="outline"
            className="w-full border-gray-600 !text-white hover:bg-gray-800"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </div>

        <div className="pt-4 text-center">
          <p className="text-xs text-gray-500">
            Free accounts get 1 scan and 5 prompts per day.
            <br />
            Upgrade to Pro for unlimited scans.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
