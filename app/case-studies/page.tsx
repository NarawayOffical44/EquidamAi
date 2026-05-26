import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Target, TrendingUp, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Founder Valuation Use Cases",
  description:
    "Illustrative startup valuation scenarios showing how founders and advisors can use Evaldam to prepare valuation ranges, assumptions, comparables, and investor-ready reports.",
  keywords:
    "startup valuation use cases, fundraising valuation scenarios, seed valuation, angel round valuation, startup valuation report",
  alternates: {
    canonical: "https://equidamai.com/case-studies",
  },
  openGraph: {
    title: "Founder Valuation Use Cases | Evaldam AI",
    description:
      "Illustrative scenarios for founders preparing valuation conversations with investors and advisors.",
    url: "https://equidamai.com/case-studies",
    type: "website",
    siteName: "Evaldam AI",
    images: [{ url: "https://equidamai.com/opengraph-image", width: 1200, height: 630, alt: "Evaldam AI startup valuation use cases" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Founder Valuation Use Cases | Evaldam AI",
    description: "Illustrative scenarios for founders preparing valuation conversations with investors and advisors.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

const scenarios = [
  {
    company: "AI SaaS founder",
    stage: "Seed to Series A",
    context: "Revenue is growing, but the founder is unsure whether the proposed pre-money valuation is defensible.",
    use: "Runs a six-method valuation, checks sensitivity around growth and margins, and exports a report for investor discussions.",
    outcome: "Leaves the conversation with a clearer low/base/high range and documented assumptions.",
    metrics: ["ARR: $500K", "Growth: 12-18% MoM", "Team: 10-15"],
  },
  {
    company: "Pre-revenue fintech",
    stage: "Angel round",
    context: "The team has a prototype and regulatory plan, but no ARR. Traditional revenue multiples are not useful yet.",
    use: "Uses Scorecard and Berkus-style logic to explain idea clarity, prototype quality, market size, and execution risks.",
    outcome: "Creates a structured starting point for angel valuation instead of guessing a number.",
    metrics: ["ARR: $0", "Prototype: Live", "Team: 3-5"],
  },
  {
    company: "Devtools startup",
    stage: "OSS to company",
    context: "An open source repo has product potential, but public adoption and monetization are still early.",
    use: "Starts with GitHub repo valuation, then upgrades to a full startup report with customer, market, and monetization assumptions.",
    outcome: "Separates repo signal from company value and identifies milestones that could increase fundability.",
    metrics: ["Repo: Public", "Model: Hosted SaaS", "Buyer: Engineering teams"],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#ffffff_100%)] text-gray-900">
      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
            Illustrative use cases
          </span>
          <h1 className="mt-5 text-3xl font-black leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            How founders use Evaldam before valuation conversations
          </h1>
          <p className="mt-5 text-base leading-relaxed text-gray-600 md:text-lg">
            These are product education scenarios, not verified customer success claims. They show how valuation workflows differ by stage, traction, and available evidence.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["6", "Valuation methods"],
            ["3", "Common fundraising situations"],
            ["PDF", "Investor-ready output"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-3xl font-black text-primary">{value}</p>
              <p className="mt-1 text-sm font-semibold text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
        <div className="grid gap-6">
          {scenarios.map((scenario) => (
            <article key={scenario.company} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[1fr_340px]">
                <div className="p-6 md:p-8">
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
                    {scenario.stage}
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-gray-900">{scenario.company}</h2>
                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    {[
                      ["Situation", scenario.context, <Target key="target" className="h-5 w-5" />],
                      ["Evaldam workflow", scenario.use, <FileText key="file" className="h-5 w-5" />],
                      ["Practical result", scenario.outcome, <TrendingUp key="trend" className="h-5 w-5" />],
                    ].map(([title, text, icon]) => (
                      <div key={String(title)}>
                        <div className="mb-2 flex items-center gap-2 text-primary">
                          {icon}
                          <p className="text-xs font-black uppercase tracking-wide">{title}</p>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 bg-gray-50 p-6 lg:border-l lg:border-t-0">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <p className="text-sm font-black text-gray-900">Example inputs</p>
                  </div>
                  <div className="space-y-3">
                    {scenario.metrics.map((metric) => (
                      <div key={metric} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700">
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
          <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">Build your own valuation case</h2>
          <p className="mt-3 text-base text-gray-600">
            Start with a free preview, then create a full report when you need assumptions, comparables, scenarios, and investor-ready output.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/free-valuation" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90">
              View Plans <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
