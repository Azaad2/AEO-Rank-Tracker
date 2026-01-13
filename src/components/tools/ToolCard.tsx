import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isPopular?: boolean;
}

const ToolCard = ({ title, description, href, icon: Icon, badge, isPopular }: ToolCardProps) => {
  return (
    <Link to={href}>
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex gap-2">
              {isPopular && (
                <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                  Popular
                </Badge>
              )}
              {badge && (
                <Badge variant="outline">{badge}</Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg mt-4 group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
          <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Try it free <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ToolCard;
