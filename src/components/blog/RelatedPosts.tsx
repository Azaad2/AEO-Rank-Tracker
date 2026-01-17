import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface RelatedPost {
  title: string;
  slug: string;
  category: string;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export const RelatedPosts = ({ posts }: RelatedPostsProps) => {
  if (posts.length === 0) return null;

  return (
    <div className="p-5 bg-slate-50 rounded-xl border">
      <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
        Related Articles
      </h4>
      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="block group"
          >
            <span className="text-xs font-medium text-primary">{post.category}</span>
            <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </p>
          </Link>
        ))}
      </div>
      <Link
        to="/blog"
        className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary hover:underline"
      >
        View all articles
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};

export default RelatedPosts;
