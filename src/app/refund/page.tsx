export const dynamic = 'force-dynamic'

import Link from "next/link";
import { Filter, ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Refund Policy</h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 20, 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. General Refund Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                Truleado offers a 14-day refund policy for all paid subscriptions. If you're not satisfied with our service, you can request a full refund within 14 days of your initial payment. No questions asked.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Free Trial Period</h2>
              <p className="text-gray-600 leading-relaxed">
                We offer a free trial to all new users. During this trial period, you can use all features of our service without charge. If you cancel your subscription before the trial period ends, you will not be charged.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Refund Eligibility</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You are eligible for a full refund if:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>You request the refund within 14 days of your initial payment</li>
                <li>You have not used the service extensively (more than 10 hours of active usage)</li>
                <li>You have not violated our terms of service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Non-Refundable Items</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The following are not eligible for refunds:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Refunds requested more than 14 days after initial payment</li>
                <li>Accounts with more than 10 hours of active usage</li>
                <li>Accounts that have violated our terms of service</li>
                <li>Duplicate refund requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How to Request a Refund</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To request a refund, simply:
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>Email us at support@truleado.com</li>
                <li>Include your account email</li>
                <li>Mention "refund request" in the subject line</li>
                <li>We'll process your refund within 24 hours</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Refund Processing</h2>
              <p className="text-gray-600 leading-relaxed">
                We process refunds within 24 hours of your request. Refunds will be issued to the original payment method used for the purchase. Processing times may vary depending on your payment provider, but typically take 3-5 business days to appear in your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cancellation Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                You can cancel your subscription at any time from your account settings. Cancellation will take effect at the end of your current billing period. You will continue to have access to the service until the end of your paid period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Chargebacks</h2>
              <p className="text-gray-600 leading-relaxed">
                If you initiate a chargeback with your bank or credit card company, we may suspend or terminate your account. We encourage you to contact us first to resolve any billing issues before initiating a chargeback.
              </p>
            </section>


            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this refund policy from time to time. Any changes will be posted on this page with an updated revision date. Continued use of our service after changes constitutes acceptance of the new policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                For refund requests or questions about this policy, please contact us at:
              </p>
              <p className="text-gray-600 leading-relaxed mt-2">
                Email: support@truleado.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
