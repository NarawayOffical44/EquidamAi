import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Target, TrendingUp, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Startup Valuation Case Studies for Founders & Advisors",
  description:
    "Illustrative startup valuation scenarios showing how founders and advisors can use Evaldam to prepare valuation ranges, assumptions, comparables, and investor-ready reports.",
  keywords:
    "startup valuation use cases, fundraising valuation scenarios, seed valuation, angel round valuation, startup valuation report",
  alternates: {
    canonical: "https://equidamai.com/case-studies",
  },
  openGraph: {
    title: "Startup Valuation Case Studies for Founders & Advisors | Evaldam AI",
    description:
      "Illustrative startup valuation scenarios showing how founders and advisors can prepare valuation ranges, assumptions, comparables, and investor-ready reports.",
    url: "https://equidamai.com/case-studies",
    type: "website",
    siteName: "Evaldam AI",
    images: [{ url: "https://equidamai.com/opengraph-image", width: 1200, height: 630, alt: "Evaldam AI startup valuation use cases" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Valuation Case Studies for Founders & Advisors | Evaldam AI",
    description: "Illustrative startup valuation scenarios showing how founders and advisors prepare valuation ranges, assumptions, comparables, and reports.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

const scenarios = [
  {
    company: "AI SaaS founder",
    stage: "Seed to Series A",
    context: "Revenue is growing but the proposed pre-money valuation feels like a guess. The founder needs a defensible number before VC calls.",
    use: "Runs a six-method valuation, models dilution at multiple pre-money scenarios, and exports a report showing low/base/high with documented assumptions.",
    outcome: "Walks into investor conversations with a range they can defend — and a shareable report that does the explaining.",
    metrics: ["ARR: $500K", "Growth: 12-18% MoM", "Team: 10-15"],
  },
  {
    company: "Pre-revenue fintech",
    stage: "Angel round",
    context: "The team has a prototype and regulatory plan but no ARR. Traditional revenue multiples aren't applicable yet.",
    use: "Uses Scorecard and Berkus-style logic to quantify idea clarity, prototype quality, market size, and execution risk — then asks the AI assistant to explain each factor to co-founders.",
    outcome: "Creates a structured starting point for angel conversations instead of a number pulled from thin air.",
    metrics: ["ARR: $0", "Prototype: Live", "Team: 3-5"],
  },
  {
    company: "Devtools startup",
    stage: "Open source to funded",
    context: "A public OSS repo has product potential but adoption and monetization are early. Investors ask for a valuation and the founder doesn't know where to start.",
    use: "Separates repo traction from company value, runs a full startup report with customer, market, and monetization assumptions, and tracks the valuation as paid seats grow.",
    outcome: "Identifies the milestones that move the needle on fundability — and has a report ready for each update.",
    metrics: ["Repo: Public", "Model: Hosted SaaS", "Buyer: Engineering teams"],
  },
  {
    company: "Founder before term sheet",
    stage: "Term sheet negotiation",
    context: "An investor has sent a term sheet. The founder needs to understand the real dilution impact before signing — and wants data to negotiate valuation.",
    use: "Models post-money ownership across multiple pre-money scenarios, runs sensitivity on ESOP pool sizing, and uses the AI assistant to work through liquidation preference implications.",
    outcome: "Goes into negotiation with numbers, not instinct — and closes at a valuation they actually understood.",
    metrics: ["Pre-money: Negotiating", "ESOP: 10-15%", "Round: Seed"],
  },
];

function getScenarioId(company: string) {
  return company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const caseStudiesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://equidamai.com/case-studies#collection",
  name: "Startup Valuation Case Studies",
  url: "https://equidamai.com/case-studies",
  description:
    "Illustrative startup valuation scenarios for founders and advisors preparing valuation ranges, assumptions, comparables, and investor-ready reports.",
  publisher: { "@id": "https://equidamai.com/#organization" },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: scenarios.map((scenario, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: scenario.company,
      description: `${scenario.stage}: ${scenario.context}`,
      url: `https://equidamai.com/case-studies#${getScenarioId(scenario.company)}`,
    })),
  },
};

export default function CaseStudiesPage() {
  return (
    <div className="public-page min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#ffffff_100%)] text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(caseStudiesJsonLd) }} />
      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            From first number to signed term sheet — how founders use Evaldam
          </h1>
          <p className="mt-5 text-base leading-relaxed text-gray-600 md:text-lg">
            Product education scenarios showing how the platform supports different stages of the fundraising journey. Not verified customer claims.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
        <div className="grid gap-6">
          {scenarios.map((scenario) => (
            <article id={getScenarioId(scenario.company)} key={scenario.company} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[1fr_340px]">
                <div className="p-6 md:p-8">
                  <p className="text-xs font-semibold text-primary">{scenario.stage}</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">{scenario.company}</h2>
                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    {[
                      ["The situation", scenario.context, <Target key="target" className="h-5 w-5" />],
                      ["How they used it", scenario.use, <FileText key="file" className="h-5 w-5" />],
                      ["What changed", scenario.outcome, <TrendingUp key="trend" className="h-5 w-5" />],
                    ].map(([title, text, icon]) => (
                      <div key={String(title)}>
                        <div className="mb-2 flex items-center gap-2 text-primary">
                          {icon}
                          <p className="text-xs font-bold text-gray-700">{title}</p>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 bg-gray-50 p-6 lg:border-l lg:border-t-0">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <p className="text-sm font-bold text-gray-900">Example inputs</p>
                  </div>
                  <div className="space-y-3">
                    {scenario.metrics.map((metric) => (
                      <div key={metric} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700">
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Start your own fundraising journey</h2>
          <p className="mt-3 text-base text-gray-600">
            Free valuation in minutes. Full report, dilution modeling, and AI guidance when you need to go deeper.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/free-valuation" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#005f5f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
              Start Your Valuation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
