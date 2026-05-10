'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight text-primary">
            evaldam
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition">Contact</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">Login</Link>
          </div>
          <Link href="/signup">
            <button className="btn btn-primary btn-sm hidden md:block">SIGN UP</button>
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 leading-tight">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p>
              Evaldam AI ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Personal Information</h3>
            <p>We collect information you voluntarily provide, including:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Name, email address, and phone number</li>
              <li>Company information and website URL</li>
              <li>Pitch deck content or company documents</li>
              <li>Payment information (processed securely via Stripe)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Technical Information</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>IP address, device type, and browser information</li>
              <li>Geographic location (country, city)</li>
              <li>Pages visited and time spent on site</li>
              <li>Session tokens for rate limiting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Provide and improve our valuation services</li>
              <li>Process your account and transactions</li>
              <li>Send you service-related announcements</li>
              <li>Respond to your inquiries and requests</li>
              <li>Analyze usage patterns and improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. All payment information is handled securely through Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Sharing Your Information</h2>
            <p>
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Service providers who assist in operations (e.g., payment processors, hosting providers)</li>
              <li>Legal authorities when required by law</li>
              <li>With your explicit consent for specific purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at info@naraway.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="font-semibold">
              Email: info@naraway.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page with an updated "last modified" date.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Last Modified: April 28, 2026
            </p>
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>© 2026 Evaldam AI. All rights reserved.</p>
          <div className="flex flex-wrap gap-6 justify-center mt-4">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
