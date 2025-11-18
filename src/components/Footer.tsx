import Link from 'next/link'
import { Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
                <img 
                  src="/truleadologo.png" 
                  alt="Truleado" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="ml-3 text-xl font-bold text-white">Truleado</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-md leading-relaxed">
              Research any website, discover strategic Reddit opportunities, and get AI-powered insights to connect with potential customers.
            </p>
            <div className="flex space-x-4">
              <a href="https://x.com/truleado" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://www.instagram.com/truleado/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/truleado" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/auth/signup" className="text-gray-400 hover:text-white transition-colors text-sm">Get Started</Link></li>
              <li><Link href="/auth/signin" className="text-gray-400 hover:text-white transition-colors text-sm">Sign In</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link href="/how-to-use" className="text-gray-400 hover:text-white transition-colors text-sm">How to Use</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Resources</h3>
            <ul className="space-y-3">
              <li><Link href="/resources/blog" className="text-gray-400 hover:text-white transition-colors text-sm">Blog</Link></li>
              <li><Link href="/resources/templates" className="text-gray-400 hover:text-white transition-colors text-sm">Templates</Link></li>
              <li><Link href="/resources/roi-calculator" className="text-gray-400 hover:text-white transition-colors text-sm">ROI Calculator</Link></li>
              <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors text-sm">Support</Link></li>
              <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors text-sm">Help</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/refund" className="text-gray-400 hover:text-white transition-colors text-sm">Refund Policy</Link></li>
              <li><Link href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</Link></li>
              <li><Link href="/gdpr" className="text-gray-400 hover:text-white transition-colors text-sm">GDPR</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm mb-2">
                Made with <span className="text-yellow-400">☕</span> on <span className="text-blue-400">🌍</span>
              </p>
              <p className="text-gray-400 text-sm">
                © 2025 Truleado Inc. All rights reserved.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link href="/support" className="text-gray-400 hover:text-white transition-colors text-sm">Support</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

