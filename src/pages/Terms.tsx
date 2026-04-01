import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Terms = () => {
  useEffect(() => {
    document.title = "Terms of Service | AIMentionYou";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Terms of Service for AIMentionYou. Your use of our AI visibility tools is subject to these terms.");
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { document.title = "AI Visibility Checker"; if (robots) robots.content = "index, follow"; };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              Terms of <span className="text-yellow-400">Service</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Last updated: January 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6 text-gray-300">
            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using AI Visibility Checker, you accept and agree to be bound by these 
                Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Description of Service</h2>
              <p className="leading-relaxed">
                AI Visibility Checker provides tools to analyze and improve your website's visibility 
                in AI-powered search engines. Our services include AI visibility scanning, content 
                optimization tools, and related analytics features.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Use of Service</h2>
              <p className="leading-relaxed mb-4">You agree to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>Use our services only for lawful purposes</li>
                <li>Not attempt to interfere with the proper functioning of our services</li>
                <li>Not scan or analyze domains you do not have permission to analyze</li>
                <li>Not use automated systems to overwhelm our servers</li>
                <li>Provide accurate information when creating accounts or submitting data</li>
              </ul>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Intellectual Property</h2>
              <p className="leading-relaxed">
                All content, features, and functionality of AI Visibility Checker, including but not 
                limited to text, graphics, logos, and software, are owned by us and are protected by 
                copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                Our services are provided "as is" and "as available" without warranties of any kind, 
                either express or implied. We do not guarantee that AI visibility scores or recommendations 
                will result in improved rankings in any AI platform. AI search results can change at any 
                time based on factors outside our control.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the fullest extent permitted by law, AI Visibility Checker shall not be liable for 
                any indirect, incidental, special, consequential, or punitive damages resulting from 
                your use of our services. Our total liability shall not exceed the amount you paid 
                (if any) for the services in question.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">User Content</h2>
              <p className="leading-relaxed">
                You retain ownership of any content you submit for analysis. By using our services, 
                you grant us a limited license to process your content solely for the purpose of 
                providing our scanning and analysis services.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Modifications</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. Changes will be 
                effective immediately upon posting. Your continued use of our services after changes 
                constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
              <p className="leading-relaxed">
                For questions about these Terms of Service, please contact us at:
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
            <Link to="/privacy" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
