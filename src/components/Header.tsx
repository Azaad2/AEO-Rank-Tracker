import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ToolsDropdown } from "./ToolsDropdown";
import { MobileNav } from "./MobileNav";
import logo from "@/assets/logo-light.png";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="AI Visibility Checker" className="h-6 w-6" />
            <span className="font-semibold text-base hidden sm:inline">AI Visibility Checker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <ToolsDropdown />
            <a 
              href="#scan" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.preventDefault();
                const scanSection = document.getElementById('scan');
                if (scanSection) {
                  scanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  window.location.href = '/#scan';
                }
              }}
            >
              Free Scan
            </a>
            <Link 
              to="/tools" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              All Tools
            </Link>
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden">
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
