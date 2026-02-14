import { Link } from "react-router-dom";
import { X, LogIn, LogOut, LayoutDashboard, HelpCircle } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-light.png";

export const MobileNav = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="AI Mention You" className="h-8 w-8" />
          <span className="font-bold">AI Mention You</span>
        </Link>
        <SheetClose asChild>
          <button className="p-2 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </SheetClose>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Main Navigation Links */}
        <div className="px-4 space-y-2 mb-4">
          {user ? (
            <SheetClose asChild>
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
            </SheetClose>
          ) : (
            <SheetClose asChild>
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
              >
                Home
              </Link>
            </SheetClose>
          )}
          <SheetClose asChild>
            <Link
              to="/tools"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
            >
              Tools
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/integrations"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
            >
              Integrations
            </Link>
          </SheetClose>
          {user ? (
            <SheetClose asChild>
              <a
                href="mailto:hello@aimentionyou.com"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
              >
                <HelpCircle className="h-5 w-5" />
                Help
              </a>
            </SheetClose>
          ) : (
            <SheetClose asChild>
              <Link
                to="/pricing"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
              >
                Pricing
              </Link>
            </SheetClose>
          )}
          <SheetClose asChild>
            <Link
              to="/blog"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
            >
              Blog
            </Link>
          </SheetClose>
        </div>

        {/* Auth Section */}
        <div className="px-4 mb-4 border-t pt-4">
          {user ? (
            <div className="space-y-2">
              <SheetClose asChild>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-400 text-black font-medium"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
              </SheetClose>
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border w-full text-left hover:bg-muted transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          ) : (
            <SheetClose asChild>
              <Link
                to="/auth"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-400 text-black font-medium"
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Link>
            </SheetClose>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-center text-xs text-muted-foreground space-y-1">
        <p>© {new Date().getFullYear()} AI Mention You</p>
        <a href="mailto:hello@aimentionyou.com" className="hover:text-foreground transition-colors block">
          hello@aimentionyou.com
        </a>
      </div>
    </div>
  );
};