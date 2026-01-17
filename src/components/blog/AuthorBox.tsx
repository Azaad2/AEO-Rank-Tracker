import { Link } from "react-router-dom";
import logo from "@/assets/logo-light.png";

export const AuthorBox = () => {
  return (
    <div className="mt-12 p-6 bg-slate-50 rounded-xl border flex gap-4 items-start">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <img src={logo} alt="AI Visibility Checker" className="h-8 w-8" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground">AI Visibility Checker Team</h4>
        <p className="text-sm text-muted-foreground mt-1">
          We're a team of SEO experts and AI researchers dedicated to helping businesses 
          understand and optimize their visibility in AI-powered search engines. Our tools 
          help you stay ahead in the age of AI search.
        </p>
        <Link 
          to="/tools" 
          className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
        >
          Explore our free tools →
        </Link>
      </div>
    </div>
  );
};

export default AuthorBox;
