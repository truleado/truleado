import Link from "next/link";
import { Search, ArrowLeft, Mail, MessageCircle, HelpCircle, Clock } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
          <p className="text-xl text-gray-600">
            We're here to help you get the most out of Truleado
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-lg p-8 mb-12">
          <div className="text-center">
            <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-6">
              Have a question or need help? Our support team is here to assist you.
            </p>
            <div className="bg-white rounded-lg p-6 inline-block">
              <p className="text-lg font-medium text-gray-900 mb-2">Email Support</p>
              <a 
                href="mailto:support@truleado.com" 
                className="text-blue-600 hover:text-blue-700 text-xl font-semibold"
              >
                support@truleado.com
              </a>
            </div>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 text-sm">
              Send us an email and we'll get back to you within 24 hours
            </p>
          </div>
          
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <HelpCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Help Center</h3>
            <p className="text-gray-600 text-sm">
              Browse our documentation and frequently asked questions
            </p>
          </div>
          
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
            <p className="text-gray-600 text-sm">
              We typically respond to support requests within 24 hours
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I get started with Truleado?</h3>
              <p className="text-gray-600">
                Simply sign up for an account, add your product details, and start discovering relevant Reddit discussions where potential customers are talking about your solution.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards through our secure payment processor. You can also use PayPal for your subscription.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How does the Reddit integration work?</h3>
              <p className="text-gray-600">
                We connect to your Reddit account (with your permission) to monitor relevant subreddits and discussions. We only access public data and never store your Reddit credentials.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                Yes! We offer a 1-day free trial so you can test all features before committing to a subscription.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Support */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is ready to help you succeed.
          </p>
          <a 
            href="mailto:support@truleado.com"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-5 h-5 mr-2" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
