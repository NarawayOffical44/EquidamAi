import { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
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
    feature: "Time to Valuation",
    evaldam: "Minutes",
    angellist: "Real-time",
    crunchbase: "Real-time",
    consultant: "2-4 weeks",
    spreadsheet: "2-4 hours",
  },
  {
    feature: "Cost",
    evaldam: "Free, Startup ₹39,700/yr, Agency ₹2,25,500/yr",
    angellist: "Free",
    crunchbase: "$2,000-$20,000/year",
    consultant: "$5,000-$25,000 per valuation",
    spreadsheet: "Free",
  },
  {
    feature: "Professional PDF Report",
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
    feature: "No Watermarks",
    evaldam: "Pro+ plans",
    angellist: "Always",
    crunchbase: "Always",
    consultant: true,
    spreadsheet: "Always",
  },
  {
    feature: "Optional Public Enrichment",
    evaldam: "When configured",
    angellist: "Partial",
    crunchbase: "Yes",
    consultant: "Varies",
    spreadsheet: false,
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
    feature: "India-Specific Market Data",
    evaldam: true,
    angellist: false,
    crunchbase: false,
    consultant: "Varies",
    spreadsheet: false,
  },
  {
    feature: "Advisor Review Workflow",
    evaldam: "Advisor plan",
    angellist: false,
    crunchbase: false,
    consultant: false,
    spreadsheet: "Possible",
  },
  {
    feature: "Valuation History & Trends",
    evaldam: true,
    angellist: false,
    crunchbase: false,
    consultant: false,
    spreadsheet: false,
  },
];

export default function WhyEvaldam() {
  return (
    <div className="public-page min-h-screen bg-white">
      <Navbar />

      <main>

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm font-bold text-primary uppercase tracking-wide mb-6">
              Why Choose Evaldam?
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Professional Valuations Without Spreadsheet Guesswork
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">
              Move from rough spreadsheet assumptions to structured valuation methods, investor-ready reports, and faster fundraising preparation.
            </p>
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
                    <p className="text-xs text-gray-600">Startup ₹39,700/yr</p>
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

      {/* Key Advantages */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-16 text-center">
            Why Founders Choose Evaldam
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            {[
              {
                title: "6 Professional Methods",
                description:
                  "Not just one algorithm. We use Scorecard, Berkus, VC Method, DCF (2 variants), and our proprietary Evaldam Score. You get a blended valuation with reasoning.",
              },
              {
                title: "Investor-Ready Reports",
                description:
                  "Professional 25-35 page PDF reports with detailed analysis, comparable companies, sensitivity analysis, and citations. No watermarks on paid plans.",
              },
              {
                title: "60-Second Results",
                description:
                  "Faster than a consultant call. Slower than a spreadsheet formula. Our AI extracts your company data from your website and generates a full analysis.",
              },
              {
                title: "Founder-Friendly Pricing",
                description:
                  "Run structured valuations during fundraising without starting every update from a blank spreadsheet or a new consultant engagement.",
              },
              {
                title: "Data Enrichment",
                description:
                  "Use website extraction and available public sources to enrich the baseline profile, then improve accuracy with founder-provided metrics.",
              },
              {
                title: "India-Focused",
                description:
                  "Developed for Indian startups. Uses India-specific benchmarks, understands local market dynamics, and supports INR valuation.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
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
            Ready to Value Your Startup?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Build a defensible valuation range before your next investor conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-valuation" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-bold text-white transition-all hover:bg-primary/90">
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
