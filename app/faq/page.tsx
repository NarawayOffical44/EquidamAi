'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allFaqs = [
    {
      q: 'How many startups can I create per month?',
      a: 'Your monthly startup quota depends on your plan: Free (1), Pro (3), Plus (15), Enterprise (Unlimited). This quota resets every month when your subscription renews.',
      keywords: ['quota', 'startups', 'monthly', 'limit', 'create', 'plan', 'allocation', 'how many']
    },
    {
      q: 'What if I delete startups? Does my quota reset?',
      a: 'No. Your monthly quota is based on CREATIONS, not current active startups. Example: If you created 15 startups this month and delete 5, you still can\'t add more until next month. However, you can freely delete startups anytime without penalty.',
      keywords: ['delete', 'quota', 'reset', 'removal', 'cancel', 'destruction']
    },
    {
      q: 'Why can\'t I add more startups even after deleting some?',
      a: 'Your monthly allocation works like this: Once you\'ve USED your monthly quota of creations, you can\'t create more until next month. Deletions don\'t restore your quota because the quota represents how many you\'ve created, not how many you currently have. This fair system prevents abuse while allowing you to manage your portfolio.',
      keywords: ['add', 'cannot', 'why', 'error', 'limit reached', 'blocked', 'unable']
    },
    {
      q: 'When does my monthly quota reset?',
      a: 'Your monthly quota resets on your subscription renewal date. For example, if you renew on the 15th of each month, your quota resets on the 15th. After renewal, you get a fresh quota for that month.',
      keywords: ['reset', 'when', 'renewal', 'date', 'cycle', 'refresh']
    },
    {
      q: 'Can I upgrade my plan to get more startups this month?',
      a: 'Yes! When you upgrade your plan, your monthly quota increases immediately. For example: upgrading from Pro (3) to Plus (15) gives you 12 more creations this month. Your quota is based on your current active plan.',
      keywords: ['upgrade', 'plan', 'premium', 'paid', 'increase', 'more']
    },
    {
      q: 'What counts as "using" my startup quota?',
      a: 'Creating a new startup profile counts as using 1 of your monthly quota. Editing, analyzing, generating reports, or deleting startups do NOT count against your quota. Only creations matter.',
      keywords: ['counts', 'usage', 'what', 'affects', 'impact', 'includes']
    },
    {
      q: 'Can I delete startups from previous months?',
      a: 'Yes, absolutely. You can delete startups anytime, regardless of when they were created. Deletions never affect your monthly quota or your ability to create new startups in the future.',
      keywords: ['delete', 'old', 'previous', 'past', 'old months', 'earlier']
    },
    {
      q: 'What happens at the end of my subscription?',
      a: 'If your subscription expires or is not renewed, you lose the ability to create new startups. However, you can still view and access all previously created startup profiles. You can reactivate your subscription anytime to regain creation ability.',
      keywords: ['subscription', 'expired', 'ends', 'expires', 'cancel', 'inactive']
    },
    {
      q: 'Can I carry over unused quota to next month?',
      a: 'No, quota does not roll over. Each month starts fresh. Example: If you only create 10 of your 15 available startups this month, you don\'t get 20 next month - you get 15 again. This encourages consistent engagement with the platform.',
      keywords: ['carryover', 'unused', 'leftover', 'next month', 'rollover', 'roll over']
    },
    {
      q: 'Is there a limit to how many reports I can generate?',
      a: 'Reports are separate from startup creation quota. Most plans have unlimited revisions/reports per startup. Free plan allows 3 evaluation reports total. See your plan details for report limits.',
      keywords: ['reports', 'limit', 'generate', 'revisions', 'valuation', 'pdf']
    }
  ];

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return allFaqs;

    const query = searchQuery.toLowerCase();
    return allFaqs.filter(faq => {
      const questionMatch = faq.q.toLowerCase().includes(query);
      const answerMatch = faq.a.toLowerCase().includes(query);
      const keywordsMatch = faq.keywords.some(kw => kw.includes(query));
      return questionMatch || answerMatch || keywordsMatch;
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight text-primary">
            evaldam
          </Link>
          <Link href="/login">
            <button className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-300 rounded hover:bg-gray-50">
              Back to App
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="bg-gradient-to-r from-gray-50 to-white py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            FAQ
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Everything you need to know about Evaldam plans and monthly startup allocation.
          </p>

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQ... (quota, delete, upgrade, etc.)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenIdx(null); // Reset open state on search
              }}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setOpenIdx(null);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {filteredFaqs.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Found {filteredFaqs.length} of {allFaqs.length} answers
            </p>
          )}
        </div>
      </div>

      {/* FAQ SECTION */}
      <div className="max-w-2xl mx-auto px-6 py-20">
        {filteredFaqs.length > 0 ? (
          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => {
              const originalIdx = allFaqs.indexOf(faq);
              return (
                <div
                  key={originalIdx}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                >
                  <button
                    onClick={() => setOpenIdx(openIdx === originalIdx ? null : originalIdx)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 text-left">
                      {faq.q}
                    </h3>
                    {openIdx === originalIdx ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                    )}
                  </button>

                  {openIdx === originalIdx && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">
              No answers found for "{searchQuery}"
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Try different keywords or browse all questions
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-2 bg-primary text-white font-semibold rounded hover:opacity-90 transition-opacity"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* CONTACT SECTION */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/5 to-violet-50 rounded-lg border border-primary/10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Didn't find your answer?
          </h2>
          <p className="text-gray-600 mb-4">
            Our team is here to help. Reach out with any questions about plans or features.
          </p>
          <Link href="/contact">
            <button className="px-6 py-2 bg-primary text-white font-semibold rounded hover:opacity-90 transition-opacity">
              Contact Support
            </button>
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>© 2026 Evaldam. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
