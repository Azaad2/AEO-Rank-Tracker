import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface BlogCardProps {
  title: string;
  description: string;
  slug: string;
  category: string;
  readTime: string;
  publishDate: string;
}

export const BlogCard = ({
  title,
  description,
  slug,
  category,
  readTime,
  publishDate,
}: BlogCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-primary/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2.5 py-0.5 bg-primary/10 text-primary rounded-full">
            {category}
          </span>
          <span className="text-xs text-muted-foreground">{publishDate}</span>
        </div>
        <Link to={`/blog/${slug}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-lg font-bold mb-2 line-clamp-2">{title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {description}
        </p>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{readTime} read</span>
        </div>
        <Link
          to={`/blog/${slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Read more
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default BlogCard;
