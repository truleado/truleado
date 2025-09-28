import Link from "next/link";
import { Filter, ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img 
                    src="/truleadologo.png" 
                    alt="Truleado" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">Truleado</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 20, 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and to provide information to website owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Truleado uses cookies for several purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and remembering your login status.</li>
                <li><strong>Analytics Cookies:</strong> We use these cookies to understand how visitors interact with our website by collecting and reporting information anonymously.</li>
                <li><strong>Preference Cookies:</strong> These cookies remember your choices and preferences to provide a more personalized experience.</li>
                <li><strong>Marketing Cookies:</strong> These cookies are used to track visitors across websites to display relevant and engaging advertisements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Session Cookies</h3>
                  <p className="text-gray-600 leading-relaxed">
                    These are temporary cookies that expire when you close your browser. They help us maintain your session while you navigate through our website.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Persistent Cookies</h3>
                  <p className="text-gray-600 leading-relaxed">
                    These cookies remain on your device for a set period or until you delete them. They help us recognize you when you return to our website.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Third-Party Cookies</h3>
                  <p className="text-gray-600 leading-relaxed">
                    These are cookies set by third-party services we use, such as analytics providers, payment processors, and social media platforms.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use the following third-party services that may set cookies:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Google Analytics:</strong> To analyze website traffic and user behavior</li>
                <li><strong>Payment Processors:</strong> To process subscription payments securely</li>
                <li><strong>Reddit API:</strong> To integrate with Reddit for lead discovery features</li>
                <li><strong>OpenAI:</strong> To provide AI-powered analysis features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have several options for managing cookies:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Browser Settings:</strong> Most browsers allow you to refuse cookies or delete them. You can usually find these settings in the "Privacy" or "Security" section of your browser.</li>
                <li><strong>Cookie Consent:</strong> When you first visit our website, you can choose which types of cookies to accept.</li>
                <li><strong>Opt-Out Links:</strong> You can opt out of specific third-party cookies by visiting their respective opt-out pages.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                If you choose to disable cookies, some features of our website may not function properly. Essential cookies are required for basic website functionality, so disabling them may prevent you from accessing certain parts of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Updates to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
              </p>
              <p className="text-gray-600 leading-relaxed mt-2">
                Email: support@truleado.com<br />
                Address: [Your Business Address]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
