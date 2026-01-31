import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Crown, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface UserProfileProps {
  planName: string;
  planPrice: number;
}

export function UserProfile({ planName, planPrice }: UserProfileProps) {
  const { user, signOut } = useAuth();

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const isPro = planName.toLowerCase() !== 'free';

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-yellow-400">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-gray-800 text-yellow-400 text-xl">
                {user?.email ? getInitials(user.email) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.email}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  className={isPro 
                    ? "bg-yellow-400 text-black" 
                    : "bg-gray-700 text-gray-300"
                  }
                >
                  {isPro && <Crown className="h-3 w-3 mr-1" />}
                  {planName}
                </Badge>
                {planPrice > 0 && (
                  <span className="text-gray-400 text-sm">
                    ${planPrice}/month
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isPro && (
              <Link to="/pricing">
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              onClick={signOut}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
