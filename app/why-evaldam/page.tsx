import { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight, MessageSquareText, TrendingUp, FileText, Percent, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Why Evaldam for Startup Valuation Reports & Comparables",
  description: "Compare Evaldam with spreadsheets, consultants, AngelList, and Crunchbase for six-method startup valuation reports, comparables, Startup AI, and PDFs.",
  alternates: {
    canonical: "https://equidamai.com/why-evaldam",
  },
  openGraph: {
    title: "Why Evaldam for Startup Valuation Reports & Comparables",
    description: "Compare Evaldam with spreadsheets, consultants, AngelList, and Crunchbase for startup valuation reports, comparables, Startup AI, and PDFs.",
    url: "https://equidamai.com/why-evaldam",
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI startup valuation comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Evaldam for Startup Valuation Reports & Comparables",
    description: "Compare Evaldam with spreadsheets, consultants, AngelList, and Crunchbase for valuation reports, comparables, Startup AI, and PDFs.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

const comparisonData = [
  {
    feature: "Professional Valuation Methods",
    evaldam: "6 methods (Scorecard, Berkus, VC Method, DCF LTG, DCF Multiples, Evaldam Score)",
    angellist: "Single algorithm",
    crunchbase: "Historical data only",
    consultant: "Varies",
    spreadsheet: "Manual calculations",
  },
  {
    feature: "AI Fundraising Assistant",
    evaldam: "Explains every number, answers follow-up questions",
    angellist: false,
    crunchbase: false,
    consultant: "Human only",
    spreadsheet: false,
  },
  {
    feature: "Dilution & Ownership Modeling",
    evaldam: "Round-by-round ownership impact",
    angellist: false,
    crunchbase: false,
    consultant: "Extra engagement",
    spreadsheet: "Manual",
  },
  {
    feature: "Term Sheet Guidance",
    evaldam: "AI explains liquidation preferences, anti-dilution",
    angellist: false,
    crunchbase: false,
    consultant: true,
    spreadsheet: false,
  },
  {
    feature: "ESOP Pool Impact Analysis",
    evaldam: "Pre/post-round founder dilution",
    angellist: false,
    crunchbase: false,
    consultant: "Extra engagement",
    spreadsheet: "Manual",
  },
  {
    feature: "Time to Valuation",
    evaldam: "Minutes",
    angellist: "Real-time",
    crunchbase: "Real-time",
    consultant: "2-4 weeks",
    spreadsheet: "2-4 hours",
  },
  {
    feature: "Cost",
    evaldam: "Free, Startup from $39/mo, Portfolio plans available",
    angellist: "Free",
    crunchbase: "$2,000-$20,000/year",
    consultant: "$5,000-$25,000 per valuation",
    spreadsheet: "Free",
  },
  {
    feature: "Shareable Investor Report (PDF)",
    evaldam: true,
    angellist: false,
    crunchbase: false,
    consultant: true,
    spreadsheet: false,
  },
  {
    feature: "Comparable Company Analysis",
    evaldam: true,
    angellist: false,
    crunchbase: true,
    consultant: true,
    spreadsheet: false,
  },
  {
    feature: "Sensitivity Analysis",
    evaldam: true,
    angellist: false,
    crunchbase: false,
    consultant: true,
    spreadsheet: true,
  },
  {
    feature: "Investor-Ready Presentation",
    evaldam: true,
    angellist: false,
    crunchbase: false,
    consultant: true,
    spreadsheet: false,
  },
  {
    feature: "Market Data (40+ countries)",
    evaldam: true,
    angellist: false,
    crunchbase: false,
    consultant: "Varies",
    spreadsheet: false,
  },
  {
    feature: "Valuation History & Tracking",
    evaldam: true,
    angellist: false,
    crunchbase: false,
    consultant: false,
    spreadsheet: false,
  },
];

const whyEvaldamJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://equidamai.com/why-evaldam#webpage",
  url: "https://equidamai.com/why-evaldam",
  name: "Why Evaldam for Startup Valuation Reports & Comparables",
  description: "Compare Evaldam with spreadsheets, consultants, AngelList, and Crunchbase for six-method startup valuation reports, comparables, Startup AI, and PDFs.",
  publisher: { "@id": "https://equidamai.com/#organization" },
};

const whyEvaldamBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://equidamai.com" },
    { "@type": "ListItem", position: 2, name: "Why Evaldam", item: "https://equidamai.com/why-evaldam" },
  ],
};

export default function WhyEvaldam() {
  return (
    <div className="public-page min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(whyEvaldamJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(whyEvaldamBreadcrumbJsonLd) }} />
      <Navbar />

      <main>

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              The platform built for how founders actually raise
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">
              Most tools hand you a number and disappear. Evaldam gives you the full picture: a defensible valuation, a shareable report, and an AI that explains every step of your fundraising journey.
            </p>
          </div>
        </div>
      </section>

      {/* Three moat pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-7">
            <MessageSquareText className="h-7 w-7 text-primary mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Startup journey assistant</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Ask about dilution, ESOP sizing, liquidation preferences, runway, or term sheet terms. The AI explains your numbers in plain language - not just outputs them.</p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-7">
            <FileText className="h-7 w-7 text-primary mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reports that do the work</h3>
            <p className="text-sm text-gray-600 leading-relaxed">A shareable PDF with methodology, comparables, assumptions, and sensitivity analysis. Send the link before an investor meeting - no more explaining yourself from scratch.</p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-7">
            <TrendingUp className="h-7 w-7 text-primary mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Track value over time</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Run a new valuation every quarter. See how your number moves as traction builds, market conditions shift, or you hit new milestones. Your history, in one place.</p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-6 font-bold text-gray-900">Feature</th>
                <th className="text-center py-4 px-6">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="font-black text-primary">Evaldam AI</p>
                    <p className="text-xs text-gray-600">From $39/mo</p>
                  </div>
                </th>
                <th className="text-center py-4 px-6">
                  <div>
                    <p className="font-bold text-gray-900">AngelList</p>
                    <p className="text-xs text-gray-600">Free</p>
                  </div>
                </th>
                <th className="text-center py-4 px-6">
                  <div>
                    <p className="font-bold text-gray-900">Crunchbase</p>
                    <p className="text-xs text-gray-600">$2K-$20K/yr</p>
                  </div>
                </th>
                <th className="text-center py-4 px-6">
                  <div>
                    <p className="font-bold text-gray-900">Consultant</p>
                    <p className="text-xs text-gray-600">$5K-$25K</p>
                  </div>
                </th>
                <th className="text-center py-4 px-6">
                  <div>
                    <p className="font-bold text-gray-900">Spreadsheet</p>
                    <p className="text-xs text-gray-600">Free</p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="py-4 px-6 font-semibold text-gray-900">{row.feature}</td>
                  <td className="py-4 px-6 text-center">
                    {typeof row.evaldam === 'boolean' ? (
                      row.evaldam ? (
                        <Check className="w-6 h-6 text-green-500 mx-auto font-bold" />
                      ) : (
                        <X className="w-6 h-6 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <p className="text-sm text-gray-900 font-semibold">{row.evaldam}</p>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {typeof row.angellist === 'boolean' ? (
                      row.angellist ? (
                        <Check className="w-6 h-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <p className="text-sm text-gray-600">{row.angellist}</p>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {typeof row.crunchbase === 'boolean' ? (
                      row.crunchbase ? (
                        <Check className="w-6 h-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <p className="text-sm text-gray-600">{row.crunchbase}</p>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {typeof row.consultant === 'boolean' ? (
                      row.consultant ? (
                        <Check className="w-6 h-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <p className="text-sm text-gray-600">{row.consultant}</p>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {typeof row.spreadsheet === 'boolean' ? (
                      row.spreadsheet ? (
                        <Check className="w-6 h-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <p className="text-sm text-gray-600">{row.spreadsheet}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Key differentiators - asymmetric layout */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
            What you get that no other tool offers
          </h2>

          {/* Row 1: wide left + narrow right */}
          <div className="grid md:grid-cols-[2fr_1fr] gap-6 mb-6">
            <div className="rounded-2xl bg-primary text-white p-8">
              <Percent className="h-7 w-7 mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-3">Dilution modeling built in</h3>
              <p className="text-white/75 text-sm leading-relaxed">
                See exactly what a $1M raise at $5M pre-money does to your cap table - before you sign. Model multiple scenarios, adjust ESOP pool size, and understand post-money ownership round by round. Most valuation tools stop at the number. This one answers what the number means for you.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-900 text-white p-8">
              <MessageSquareText className="h-7 w-7 mb-4 opacity-70" />
              <h3 className="text-xl font-bold mb-3">Ask anything</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Liquidation preferences. Anti-dilution provisions. What your runway says about your valuation. The AI assistant answers in plain language - no finance degree required.
              </p>
            </div>
          </div>

          {/* Row 2: narrow left + wide right */}
          <div className="grid md:grid-cols-[1fr_2fr] gap-6 mb-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <TrendingUp className="h-7 w-7 text-primary mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Track every round</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every valuation saved. Your number over time, visible in one place. Show investors how far you&apos;ve come.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <FileText className="h-7 w-7 text-primary mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">A report that speaks for itself</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                A 25-35 page PDF with methodology, comparables, sensitivity analysis, and documented assumptions. Share a link before the meeting so the investor arrives informed - not skeptical. Built on 6 proven valuation methods, with benchmarks across 40+ markets. No consultant engagement needed.
              </p>
            </div>
          </div>

          {/* Row 3: three equal */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: Users, title: "Built for 40+ markets", body: "Country-specific benchmarks and multi-currency support. Depth in emerging markets like India that global tools overlook." },
              { Icon: Percent, title: "Priced for founders", body: "Free to start. Paid plans built around how founders actually raise - not how consultants charge." },
              { Icon: TrendingUp, title: "Minutes, not weeks", body: "AI-extracted company profile, six methods run in parallel, shareable report ready before your next call." },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-7">
                <Icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
          Common Questions
        </h2>

        <div className="space-y-6">
          {[
            {
              q: "Is Evaldam a substitute for professional consulting?",
              a: "No, Evaldam is a valuation tool, not a legal or investment advisory service. It's ideal for founders who want to understand their valuation quickly and affordably. For complex situations, consult with a professional advisor.",
            },
            {
              q: "How accurate is the Evaldam valuation?",
              a: "Our valuation is based on 6 professional methods and public market data. Accuracy depends on data quality. We show a confidence score and note which data is missing. Most founders use it as a starting point for investor conversations.",
            },
            {
              q: "Can I use this for multiple valuations?",
              a: "Yes. Founder and Advisor plans are designed for repeat valuations, so founders can update assumptions and track how new metrics affect valuation over time.",
            },
            {
              q: "What if I don't trust the valuation?",
              a: "You can adjust assumptions in our sensitivity analysis to see how different metrics impact valuation. Or run a free check to compare with our baseline.",
            },
            {
              q: "Can investors see my valuation?",
              a: "Only if you share it. You can download the PDF and send it privately, or enable the investor share link from a report page. Shared links can be turned off again.",
            },
          ].map((item, idx) => (
            <details
              key={idx}
              className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer group"
            >
              <summary className="font-bold text-gray-900 text-lg flex items-center justify-between">
                {item.q}
                <span className="text-primary group-open:rotate-180 transition-transform">+</span>
              </summary>
              <p className="text-gray-600 mt-4">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
            Know your number. Know your options.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start free. Get a valuation, understand your dilution, and walk into investor conversations with a report they can read before you meet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-valuation" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-[#005f5f] px-8 py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
              Get Free Valuation <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-8 py-4 font-bold text-primary transition-all hover:bg-primary/5">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
}
