import { Link } from "react-router-dom";
import { Menu, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ToolsDropdown } from "./ToolsDropdown";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-light.png";

export const Header = () => {
  const { user, isLoading, signOut } = useAuth();

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="AI Mention You" className="h-6 w-6" />
            <span className="font-semibold text-base hidden sm:inline">AI Mention You</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
            )}
            <Link 
              to="/tools" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tools
            </Link>
            <Link 
              to="/integrations" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Integrations
            </Link>
            {user ? (
              <a 
                href="mailto:hello@aimentionyou.com" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Help
              </a>
            ) : (
              <Link 
                to="/pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            )}
            <Link 
              to="/blog" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>

            {/* Auth Section */}
            {!isLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8 border border-yellow-400">
                          <AvatarFallback className="bg-gray-800 text-yellow-400 text-sm">
                            {getInitials(user.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700" align="end">
                      <div className="px-2 py-1.5">
                        <p className="text-sm text-white font-medium truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center cursor-pointer text-gray-300 hover:text-white">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem 
                        onClick={signOut}
                        className="cursor-pointer text-gray-300 hover:text-white"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth">
                    <Button 
                      size="sm" 
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                    >
                      Sign In
                    </Button>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {!isLoading && user && (
              <Link to="/dashboard">
                <Avatar className="h-8 w-8 border border-yellow-400">
                  <AvatarFallback className="bg-gray-800 text-yellow-400 text-sm">
                    {getInitials(user.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                <MobileNav />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
