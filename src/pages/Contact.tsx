import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Mail, MessageSquare } from "lucide-react";

const Contact = () => {
  useEffect(() => {
    document.title = "Contact Us | AI Visibility Checker";
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              Contact <span className="text-yellow-400">Us</span>
            </h1>
            <p className="text-gray-400 text-lg">
              We'd love to hear from you
            </p>
          </div>

          {/* Contact Options */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-400/10 rounded-lg">
                  <Mail className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Email Us</h2>
                  <p className="text-gray-400 mb-4">
                    For general inquiries, partnerships, or feedback, reach out via email. 
                    We typically respond within 24-48 hours.
                  </p>
                  <a 
                    href="mailto:hello@aimentionyou.com" 
                    className="text-yellow-400 hover:text-yellow-300 font-medium text-lg transition-colors"
                  >
                    hello@aimentionyou.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-400/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Common Questions</h2>
                  <p className="text-gray-400 mb-4">
                    Before reaching out, you might find your answer in our FAQ section on the homepage.
                  </p>
                  <a 
                    href="/#faq" 
                    className="inline-block bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    View FAQ
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  to="/"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Free AI Scan
                </Link>
                <Link 
                  to="/tools"
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  All Tools
                </Link>
                <Link 
                  to="/blog"
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} AI Visibility Checker. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">Home</Link>
            <Link to="/about" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">About</Link>
            <Link to="/privacy" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
