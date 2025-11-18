import Link from "next/link";
import { Filter, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function GDPRPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">GDPR Compliance</h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 20, 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                The General Data Protection Regulation (GDPR) is a European Union regulation that governs the collection, processing, and storage of personal data. Truleado is committed to protecting your privacy and ensuring compliance with GDPR requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Legal Basis for Processing</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Consent:</strong> When you explicitly consent to data processing, such as subscribing to our newsletter or using our services</li>
                <li><strong>Contract Performance:</strong> To provide our services and fulfill our contractual obligations to you</li>
                <li><strong>Legitimate Interest:</strong> To improve our services, prevent fraud, and ensure security</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Your Rights Under GDPR</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                As a data subject, you have the following rights:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Right of Access</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You have the right to request access to your personal data and receive information about how we process it.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Right to Rectification</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You can request that we correct any inaccurate or incomplete personal data we hold about you.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Right to Erasure (Right to be Forgotten)</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You can request that we delete your personal data in certain circumstances, such as when it's no longer necessary for the original purpose.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Right to Restrict Processing</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You can request that we limit how we process your personal data in certain situations.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Right to Data Portability</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You have the right to receive your personal data in a structured, commonly used format and transfer it to another controller.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Right to Object</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You can object to the processing of your personal data for direct marketing purposes or when processing is based on legitimate interests.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Rights Related to Automated Decision Making</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You have the right not to be subject to decisions based solely on automated processing that significantly affect you.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect the following categories of personal data:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Identity Data:</strong> Name, email address, username</li>
                <li><strong>Contact Data:</strong> Email address, billing address</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                <li><strong>Usage Data:</strong> Information about how you use our service</li>
                <li><strong>Marketing Data:</strong> Your preferences for receiving marketing communications</li>
                <li><strong>Reddit Data:</strong> Public Reddit data accessed with your permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How We Use Your Data</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use your personal data for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>To provide and maintain our service</li>
                <li>To process payments and manage subscriptions</li>
                <li>To communicate with you about your account and our services</li>
                <li>To improve our service and develop new features</li>
                <li>To comply with legal obligations</li>
                <li>To protect against fraud and ensure security</li>
                <li>To send marketing communications (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Sharing and Transfers</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may share your personal data with:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Service Providers:</strong> Third-party companies that help us operate our service (e.g., payment processors, analytics providers)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                When we transfer data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. When you delete your account, we will delete your personal data within 30 days, unless we are required to retain it for legal reasons.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes encryption, access controls, and regular security assessments.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Exercising Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To exercise any of your GDPR rights, please contact us at support@truleado.com. We will respond to your request within one month of receipt. You may be asked to verify your identity before we can process your request.
              </p>
              <p className="text-gray-600 leading-relaxed">
                If you are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Data Protection Officer</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about our data protection practices or this GDPR compliance statement, you can contact our Data Protection Officer at support@truleado.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Updates to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this GDPR compliance statement from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated statement on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                For any questions about GDPR compliance or to exercise your rights, please contact us at:
              </p>
              <p className="text-gray-600 leading-relaxed mt-2">
                Email: support@truleado.com<br />
                Address: [Your Business Address]
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
