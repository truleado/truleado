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
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-white" />
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
                Truleado operates on a subscription-based model with a 1-day free trial. All subscription fees are generally non-refundable. However, we understand that exceptional circumstances may arise, and we will consider refund requests on a case-by-case basis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Free Trial Period</h2>
              <p className="text-gray-600 leading-relaxed">
                We offer a 1-day free trial to all new users. During this trial period, you can use all features of our service without charge. If you cancel your subscription before the trial period ends, you will not be charged.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Refund Eligibility</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Refunds may be considered in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Technical issues that prevent you from using the service</li>
                <li>Billing errors on our part</li>
                <li>Duplicate charges</li>
                <li>Service outages lasting more than 24 hours</li>
                <li>Other exceptional circumstances at our discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Non-Refundable Items</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The following are not eligible for refunds:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Subscription fees after the free trial period</li>
                <li>Charges for services already rendered</li>
                <li>Refunds requested more than 30 days after payment</li>
                <li>Refunds due to user error or misunderstanding</li>
                <li>Refunds for unused portions of subscription periods</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How to Request a Refund</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To request a refund, please:
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>Contact our support team at support@truleado.com</li>
                <li>Provide your account email and order details</li>
                <li>Explain the reason for your refund request</li>
                <li>Include any relevant documentation or screenshots</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Refund Processing</h2>
              <p className="text-gray-600 leading-relaxed">
                If your refund request is approved, we will process the refund within 5-10 business days. Refunds will be issued to the original payment method used for the purchase. Processing times may vary depending on your payment provider.
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Credits</h2>
              <p className="text-gray-600 leading-relaxed">
                In some cases, we may offer service credits instead of refunds. Service credits can be applied to future subscription periods and do not expire.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                If you are not satisfied with our refund decision, you may contact us to discuss the matter further. We are committed to resolving disputes fairly and promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this refund policy from time to time. Any changes will be posted on this page with an updated revision date. Continued use of our service after changes constitutes acceptance of the new policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                For refund requests or questions about this policy, please contact us at:
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
