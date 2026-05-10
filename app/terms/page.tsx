'use client';

import Link from 'next/link';

export default function TermsPage() {
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
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 leading-tight">Terms and Conditions</h1>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this website and service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on Evaldam AI's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              <li>Use automated tools to scrape or collect data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Disclaimer</h2>
            <p>
              The materials on Evaldam AI's website are provided on an 'as is' basis. Evaldam AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p className="mt-4">
              Valuations provided are estimates based on available data and should not be considered as investment advice. Past valuations do not guarantee future accuracy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Limitations</h2>
            <p>
              In no event shall Evaldam AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Evaldam AI's website, even if Evaldam AI or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Evaldam AI's website could include technical, typographical, or photographic errors. Evaldam AI does not warrant that any of the materials on its website are accurate, complete, or current. Evaldam AI may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Links</h2>
            <p>
              Evaldam AI has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Evaldam AI of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Modifications</h2>
            <p>
              Evaldam AI may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. User Obligations</h2>
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Provide accurate information when creating an account</li>
              <li>Maintain the confidentiality of your password</li>
              <li>Not use the service for illegal or unauthorized purposes</li>
              <li>Not harass, abuse, or harm others</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Payment Terms</h2>
            <p>
              All fees are exclusive of applicable taxes. You agree to pay the fees associated with your plan. Subscription cancellations can be made at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <p className="font-semibold">
              Email: info@naraway.com
            </p>
          </section>

          <section>
            <p className="text-gray-500 text-sm">
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
