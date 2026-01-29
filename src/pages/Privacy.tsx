import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | AI Visibility Checker";
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              Privacy <span className="text-yellow-400">Policy</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Last updated: January 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6 text-gray-300">
            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Introduction</h2>
              <p className="leading-relaxed">
                AI Visibility Checker ("we", "our", or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, and safeguard your information when 
                you use our website and services.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Information We Collect</h2>
              <p className="leading-relaxed mb-4">We may collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li><strong className="text-white">Domain Information:</strong> The domain names you submit for scanning</li>
                <li><strong className="text-white">Search Prompts:</strong> The prompts/keywords you enter for analysis</li>
                <li><strong className="text-white">Email Address:</strong> When you choose to receive reports or unlock results</li>
                <li><strong className="text-white">Usage Data:</strong> Anonymous analytics about how you use our tools</li>
              </ul>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>To provide and improve our AI visibility scanning services</li>
                <li>To send you scan reports and results when requested</li>
                <li>To analyze usage patterns and improve our tools</li>
                <li>To communicate with you about updates or new features</li>
              </ul>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Data Security</h2>
              <p className="leading-relaxed">
                We implement appropriate security measures to protect your personal information. 
                Scan data is processed securely and we do not share your business information with 
                third parties for marketing purposes.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Cookies</h2>
              <p className="leading-relaxed">
                We use essential cookies to ensure our website functions properly. We may also use 
                analytics cookies to understand how visitors interact with our site. You can control 
                cookie preferences through your browser settings.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Third-Party Services</h2>
              <p className="leading-relaxed">
                Our services may integrate with third-party AI platforms (like OpenAI, Google) to 
                analyze your visibility. These platforms have their own privacy policies. We only 
                share the minimum necessary information to perform the analysis you request.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Your Rights</h2>
              <p className="leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>Request access to your personal data</li>
                <li>Request correction or deletion of your data</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <a 
                href="mailto:hello@aimentionyou.com" 
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                hello@aimentionyou.com
              </a>
            </section>
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
            <Link to="/terms" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
