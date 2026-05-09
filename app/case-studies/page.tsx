import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp, Users, Target } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Case Studies | Evaldam AI - Startup Valuation Scenarios",
  description: "See example scenarios showing how founders can use Evaldam to understand valuation, prepare investor conversations, and structure fundraising decisions.",
  keywords: "startup funding, valuation success, series A funding, seed round, angel investment, startup case study",
  alternates: {
    canonical: "https://equidamai.com/case-studies",
  },
  openGraph: {
    title: "Startup Valuation Case Studies | Evaldam AI",
    description: "Founder scenarios showing how Evaldam supports valuation confidence, investor preparation, and fundraising decisions.",
    url: "https://equidamai.com/case-studies",
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/logo.png",
        width: 360,
        height: 360,
        alt: "Evaldam AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Startup Valuation Case Studies | Evaldam AI",
    description: "Founder scenarios for valuation confidence and investor preparation.",
    images: ["https://equidamai.com/logo.png"],
  },
};

const caseStudies = [
  {
    id: 1,
    companyName: "TechFlow AI",
    industry: "AI/ML SaaS",
    stage: "Series A",
    founderName: "Priya Sharma",
    founderImage: "👩‍💼",
    problem: "Couldn't determine realistic valuation for Series A round. Unsure if asking for $3M was too aggressive or too conservative.",
    solution: "Used Evaldam's 6-method analysis to understand valuation drivers. Discovered team quality added 40% premium. Generated professional PDF report.",
    results: {
      valuationRange: "$8.5M - $12.5M",
      raised: "$10M Series A",
      investors: "3 top-tier VCs",
      improvement: "20% higher valuation than initial ask",
    },
    quote: "Evaldam gave us data-backed confidence. We showed investors the full 6-method analysis and they were impressed by our preparation.",
    metrics: {
      arr: "$500K",
      growth: "15% MoM",
      teamSize: 12,
    },
  },
  {
    id: 2,
    companyName: "FinServe India",
    industry: "FinTech",
    stage: "Seed Round",
    founderName: "Amit Patel",
    founderImage: "👨‍💼",
    problem: "Pre-revenue startup. Angels asked 'What's your valuation?' Had no framework to answer confidently.",
    solution: "Ran Evaldam analysis with projections. Used Scorecard + Berkus methods. Showed potential to angel investors with professional report.",
    results: {
      valuationRange: "$2M - $3.5M",
      raised: "$800K Seed",
      investors: "8 Angel investors",
      improvement: "Confident in valuation strategy",
    },
    quote: "As a first-time founder, I had no idea how to value my startup. Evaldam gave me a framework and professional report to show investors.",
    metrics: {
      arr: "$0",
      growth: "Projecting 25% MoM",
      teamSize: 4,
    },
  },
  {
    id: 3,
    companyName: "CloudOps Pro",
    industry: "DevOps SaaS",
    stage: "Series A",
    founderName: "Rahul Kumar",
    founderImage: "👨‍💼",
    problem: "Struggling to justify $15M valuation to investors. Needed to show valuation was based on comparable companies and market data.",
    solution: "Used Evaldam's comparable company analysis. Got detailed sensitivity analysis showing impact of key metrics. Shared professional 35-page report with VCs.",
    results: {
      valuationRange: "$12M - $18M",
      raised: "$15M Series A",
      investors: "2 Tier-1 VCs + 1 Tier-2",
      improvement: "Valuation accepted on first attempt",
    },
    quote: "The comparable company analysis was crucial. It showed we were undervalued at $12M and justified our $15M ask perfectly.",
    metrics: {
      arr: "$1.2M",
      growth: "20% MoM",
      teamSize: 18,
    },
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm font-bold text-primary uppercase tracking-wide mb-6">
            Founder Scenarios
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
            How Founders Can Use Evaldam to Prepare for Funding
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Illustrative examples showing how startup founders can use professional valuation analysis before Series A, Seed, and Angel conversations.
          </p>
          <p className="text-xs text-gray-500 mt-4 max-w-2xl mx-auto">
            These scenarios are examples for product education. Replace them with verified customer stories as soon as real customer approvals are available.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-4xl font-black text-primary mb-3">6</div>
            <p className="text-gray-600 font-semibold">Professional valuation methods</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-4xl font-black text-primary mb-3">4</div>
            <p className="text-gray-600 font-semibold">Inputs checked in free valuation</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-4xl font-black text-primary mb-3">60s</div>
            <p className="text-gray-600 font-semibold">Typical first estimate workflow</p>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="space-y-12">
          {caseStudies.map((study, index) => (
            <div
              key={study.id}
              className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow ${
                index % 2 === 0 ? "" : "lg:flex-row-reverse"
              }`}
            >
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left: Case Study Details */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-4">
                      {study.stage} Round
                    </span>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{study.companyName}</h2>
                    <p className="text-gray-600 font-semibold">{study.industry}</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide text-gray-500">Challenge</h3>
                      <p className="text-gray-700">{study.problem}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide text-gray-500">Solution</h3>
                      <p className="text-gray-700">{study.solution}</p>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-lg p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">Results</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Valuation Range</span>
                        <span className="font-bold text-primary">{study.results.valuationRange}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Example Round</span>
                        <span className="font-bold text-green-600">{study.results.raised}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Lead Investors</span>
                        <span className="font-bold text-gray-900">{study.results.investors}</span>
                      </div>
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 italic">"{study.results.improvement}"</p>
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="border-l-4 border-primary pl-4">
                    <p className="text-lg font-semibold text-gray-900 mb-3">"{study.quote}"</p>
                    <p className="text-gray-600">
                      <span className="font-bold">{study.founderImage} {study.founderName}</span> • {study.companyName}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 md:p-10 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide text-gray-500">Company Metrics</h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-primary" />
                        <span className="text-sm text-gray-600">Annual Recurring Revenue (ARR)</span>
                      </div>
                      <p className="text-3xl font-black text-gray-900">{study.metrics.arr}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <span className="text-sm text-gray-600">Monthly Growth Rate</span>
                      </div>
                      <p className="text-3xl font-black text-gray-900">{study.metrics.growth}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-sm text-gray-600">Team Size</span>
                      </div>
                      <p className="text-3xl font-black text-gray-900">{study.metrics.teamSize}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-300">
                    <p className="text-sm text-gray-600 mb-4">
                      Similar metrics? Get your personalized valuation analysis.
                    </p>
                    <Link href="/free-valuation">
                      <button className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                        Get Your Valuation <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">Ready to Value Your Startup?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Start with a free estimate, then upgrade when you need the full investor-ready report.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-valuation">
              <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all inline-flex items-center gap-2">
                Get Free Valuation <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-4 border-2 border-primary text-primary hover:bg-primary/5 font-bold rounded-lg transition-all">
                View Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
