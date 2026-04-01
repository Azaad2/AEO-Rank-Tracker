import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "404 Page Not Found | AIMentionYou";
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { document.title = "AI Visibility Checker"; if (robots) robots.content = "index, follow"; };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-yellow-400">404</h1>
        <p className="mb-4 text-xl text-gray-300">Page not found</p>
        <Link to="/" className="text-yellow-400 underline hover:text-yellow-300">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
