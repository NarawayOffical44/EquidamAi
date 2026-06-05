'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight text-primary">
            Evaldam AI
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition">Contact</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">Login</Link>
          </div>
          <Link href="/signup" className="btn btn-primary btn-sm hidden md:block">
            SIGN UP
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 leading-tight">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p>
              Evaldam AI ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, retain, and safeguard information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Personal and Business Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Name, email address, phone number, company information, and website URL</li>
              <li>Account, subscription, billing status, team membership, and support information</li>
              <li>Startup valuation inputs, pitch deck content, company documents, assumptions, and generated reports</li>
              <li>AI chat prompts, responses, usage counters, evidence records, and report download records</li>
              <li>Payment information processed securely by Stripe; we do not store full card numbers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Technical Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>IP address, device type, browser information, location signals, and session tokens for rate limiting</li>
              <li>Cookie consent choices, attribution parameters, pages visited, and product usage events</li>
              <li>Web Vitals, API latency signals, error telemetry, logs, and security events</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Provide valuation previews, full reports, portfolio workflows, API credits, team features, and account support</li>
              <li>Generate AI-assisted valuation outputs, benchmark context, assumptions, and report content</li>
              <li>Process accounts, payments, subscriptions, refunds, usage limits, and service communications</li>
              <li>Measure product reliability, Web Vitals, API performance, production errors, abuse prevention, and security</li>
              <li>Analyze usage patterns, improve user experience, and comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. AI Processing</h2>
            <p>
              Evaldam uses internal systems and selected AI infrastructure providers to process startup information, prompts, and report data for valuation-related features. Do not submit sensitive personal data, passwords, government IDs, bank credentials, or confidential third-party information unless you have authority to share it.
            </p>
            <p>
              AI outputs are generated for business analysis support and may be reviewed, logged, or retained to operate, secure, debug, and improve the service. They are not legal, tax, investment, or certified valuation advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Cookies and Analytics</h2>
            <p>
              We use essential cookies and local storage for authentication, security, rate limiting, attribution, and core product operation. Analytics cookies and performance tracking, including Google Analytics and Web Vitals, are used only after you accept analytics cookies where consent is required.
            </p>
            <p>
              You can choose essential-only cookies from the cookie banner. Browser settings may also let you delete cookies or block future storage, but some product features may stop working correctly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain account, subscription, valuation, report, team, usage, support, and audit data for as long as needed to provide the service, comply with legal obligations, prevent abuse, resolve disputes, and maintain business records. Lead and marketing records may be retained until you request deletion or opt out, unless a longer retention period is required.
            </p>
            <p>
              Error logs, analytics events, and operational telemetry are retained for security, debugging, and reliability monitoring and are periodically reviewed or deleted according to operational needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Data Security</h2>
            <p>
              We implement technical and organizational security measures to protect personal and business information from unauthorized access, alteration, disclosure, or destruction. No internet service can guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Service providers for hosting, database, authentication, payments, email, analytics, monitoring, customer support, and AI infrastructure</li>
              <li>Legal authorities when required by law or to protect rights, safety, and service integrity</li>
              <li>Other parties with your explicit consent for specific purposes</li>
            </ul>
            <p>
              These providers may process information in countries other than your own. Where required, we use contractual and operational safeguards for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Your Rights</h2>
            <p>
              You may request access, correction, deletion, export, restriction, or objection where applicable law provides those rights. You may also opt out of marketing emails. To exercise rights, contact us at hello@equidamai.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at:</p>
            <p className="font-semibold">Email: hello@equidamai.com</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated policy on this page with an updated last modified date.
            </p>
            <p className="text-gray-500 text-sm mt-4">Last Modified: May 20, 2026</p>
          </section>
        </div>
      </main>

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
