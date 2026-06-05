import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { authoritySignals } from "@/lib/seo/authority";

export type PillarPageSlug =
  | "pre-money-vs-post-money-valuation"
  | "startup-cap-table-valuation"
  | "safe-valuation-cap"
  | "term-sheet-valuation"
  | "409a-valuation";

type PillarSection = {
  title: string;
  text: string;
  bullets: string[];
};

type PillarRelatedGuide = {
  title: string;
  href: string;
};

type PillarPageContent = {
  slug: PillarPageSlug;
  keyword: string;
  title: string;
  description: string;
  intro: string;
  sections: PillarSection[];
  faqs: { question: string; answer: string }[];
  relatedGuides: PillarRelatedGuide[];
};

export const pillarPages: Record<PillarPageSlug, PillarPageContent> = {
  "pre-money-vs-post-money-valuation": {
    slug: "pre-money-vs-post-money-valuation",
    keyword: "pre-money vs post-money valuation",
    title: "Pre-Money vs Post-Money Valuation for Founders",
    description:
      "Understand pre-money vs post-money valuation, ownership impact, dilution, SAFE conversion context, and what founders should clarify before investor conversations.",
    intro:
      "Pre-money and post-money valuation sound similar, but they answer different ownership questions. Founders need both numbers clear before comparing offers, round size, and dilution.",
    sections: [
      {
        title: "What the difference changes",
        text: "Pre-money valuation is the company value before new capital. Post-money valuation includes the new investment and usually drives investor ownership.",
        bullets: ["Round size changes the post-money number.", "Option pool changes can shift founder dilution.", "SAFE notes can convert using post-money logic."],
      },
      {
        title: "What founders should prepare",
        text: "A defensible range is stronger than a single headline number because investors will test assumptions and ownership outcomes.",
        bullets: ["Low, base, and high valuation range.", "Expected dilution by round size.", "Existing notes, SAFEs, and option pool impact."],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam turns stage, traction, market context, and assumptions into a valuation range founders can discuss before term sheets arrive.",
        bullets: ["Six valuation methods.", "Assumptions trail.", "Investor-ready PDF report."],
      },
    ],
    faqs: [
      {
        question: "Which number should founders negotiate?",
        answer: "Founders should understand both, but ownership normally depends on the post-money outcome after investment, option pool, and conversion mechanics.",
      },
      {
        question: "Can pre-money and post-money confusion cause dilution surprises?",
        answer: "Yes. A strong headline valuation can still lead to unexpected dilution if the round size, option pool, or convertible instruments are not modeled clearly.",
      },
    ],
    relatedGuides: [
      { title: "Pre-Money vs Post-Money Valuation: The Founder Difference", href: "/blog/pre-money-vs-post-money-valuation-founders" },
      { title: "Pre-Money Valuation Guide for Founders", href: "/blog/pre-money-valuation-guide-for-founders" },
    ],
  },
  "startup-cap-table-valuation": {
    slug: "startup-cap-table-valuation",
    keyword: "startup cap table valuation",
    title: "Startup Cap Table Valuation Guide",
    description:
      "Use cap table context to understand startup valuation, founder dilution, investor ownership, option pools, SAFEs, and future financing readiness.",
    intro:
      "A startup valuation is not only a company price. It becomes a cap table outcome: who owns what before and after the round, and whether the company remains financeable.",
    sections: [
      {
        title: "Why valuation and ownership connect",
        text: "Investors review valuation alongside founder ownership, option pool needs, prior financing, and future dilution risk.",
        bullets: ["Founder ownership after the round.", "Existing investor rights and conversion terms.", "Option pool size before and after financing."],
      },
      {
        title: "Signals investors notice",
        text: "A clean cap table makes the valuation easier to trust because ownership, incentives, and future financing needs are easier to understand.",
        bullets: ["Unusual advisor grants.", "Too much early dilution.", "Missing or unclear convertible instrument terms."],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam helps founders connect valuation assumptions to investor-ready context, then document the range and reasoning before discussions.",
        bullets: ["Valuation range before dilution modeling.", "Scenario and sensitivity analysis.", "Report-ready assumptions and evidence."],
      },
    ],
    faqs: [
      {
        question: "Does Evaldam replace cap table software?",
        answer: "No. Evaldam focuses on valuation ranges and investor-ready reporting. Cap table software remains the right system of record for ownership administration.",
      },
      {
        question: "Why does the cap table affect valuation conversations?",
        answer: "A cap table can reveal dilution risk, incentive problems, option pool pressure, and terms that affect how much ownership investors receive.",
      },
    ],
    relatedGuides: [
      { title: "Cap Table Basics for Founders", href: "/blog/cap-table-basics-founder-ownership" },
      { title: "Startup Dilution and Valuation", href: "/blog/startup-dilution-and-valuation" },
    ],
  },
  "safe-valuation-cap": {
    slug: "safe-valuation-cap",
    keyword: "SAFE valuation cap",
    title: "SAFE Valuation Cap Guide for Founders",
    description:
      "Understand SAFE valuation caps, discounts, priced-round conversion, dilution, and how founders can set a more defensible cap before fundraising.",
    intro:
      "A SAFE valuation cap sets the maximum valuation used for conversion in a future priced round. The cap can shape investor ownership even before the priced round exists.",
    sections: [
      {
        title: "What the cap controls",
        text: "The cap protects early investors if the next priced round is higher. It can create meaningful dilution when the company later raises at a premium.",
        bullets: ["Conversion valuation ceiling.", "Investor ownership at the priced round.", "Interaction with discounts and MFN terms."],
      },
      {
        title: "What founders should model",
        text: "A cap should be tested against expected round size, future valuation, existing SAFEs, and the ownership founders need to keep building.",
        bullets: ["Cap versus expected next round.", "Multiple SAFE stack impact.", "Founder ownership after conversion."],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam gives founders a structured valuation range before they discuss caps, discounts, and investor ownership.",
        bullets: ["Stage-aware valuation methods.", "Assumptions and risk notes.", "Investor-ready report context."],
      },
    ],
    faqs: [
      {
        question: "Is a lower SAFE valuation cap always better for investors?",
        answer: "Usually it gives investors more upside on conversion, but founders should evaluate whether the dilution and future fundraising signal are acceptable.",
      },
      {
        question: "Should founders set a SAFE cap from a valuation range?",
        answer: "A valuation range helps founders understand the cap negotiation, but legal and financing terms should be reviewed with qualified counsel.",
      },
    ],
    relatedGuides: [
      { title: "SAFE Valuation Caps: A Founder Guide", href: "/blog/safe-valuation-cap-founder-guide" },
      { title: "Valuation Cap vs Discount", href: "/blog/valuation-cap-vs-discount-safe-terms" },
    ],
  },
  "term-sheet-valuation": {
    slug: "term-sheet-valuation",
    keyword: "term sheet valuation",
    title: "Term Sheet Valuation Guide for Founders",
    description:
      "Review term sheet valuation terms, option pools, liquidation preferences, investor ownership, dilution, and the founder economics behind a startup financing offer.",
    intro:
      "The valuation in a term sheet is only one part of founder economics. Option pools, liquidation preferences, investor rights, and conversion mechanics can change the real outcome.",
    sections: [
      {
        title: "What to read beyond the headline price",
        text: "Founders should connect valuation to the terms that decide ownership, proceeds, control, and future fundraising flexibility.",
        bullets: ["Pre-money or post-money basis.", "Option pool expansion.", "Liquidation preference and participation."],
      },
      {
        title: "What investors are testing",
        text: "Investors want a valuation that can be defended with evidence and that leaves the company able to raise the next round.",
        bullets: ["Traction quality.", "Market and comparable context.", "Use of funds and milestone plan."],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam helps founders prepare the valuation evidence before a term sheet becomes the negotiation anchor.",
        bullets: ["Valuation method breakdown.", "Comparable reasoning.", "Sensitivity analysis and PDF export."],
      },
    ],
    faqs: [
      {
        question: "Can a term sheet valuation be misleading?",
        answer: "Yes. The headline valuation can look attractive while other terms shift dilution, downside protection, or founder economics.",
      },
      {
        question: "What should founders prepare before reviewing valuation terms?",
        answer: "Founders should prepare a valuation range, assumptions, dilution scenarios, cap table context, and milestones supported by the round.",
      },
    ],
    relatedGuides: [
      { title: "Term Sheet Valuation: What Founders Should Notice", href: "/blog/term-sheet-valuation-founder-economics" },
      { title: "Liquidation Preference and Founder Valuation", href: "/blog/liquidation-preference-startup-founder-valuation" },
    ],
  },
  "409a-valuation": {
    slug: "409a-valuation",
    keyword: "409A valuation",
    title: "409A Valuation and Fundraising Valuation",
    description:
      "Understand 409A valuation, common stock fair market value, employee options, fundraising valuation differences, and when startups need professional support.",
    intro:
      "A 409A valuation and a fundraising valuation serve different purposes. US startups often need 409A context for common stock and options, while investors negotiate preferred-stock economics.",
    sections: [
      {
        title: "Why the numbers can differ",
        text: "409A work generally supports common stock fair market value. Fundraising valuation reflects investor terms, preferred economics, growth expectations, and negotiation context.",
        bullets: ["Common stock versus preferred stock.", "Employee option pricing context.", "Fundraising expectations and investor rights."],
      },
      {
        title: "When founders should pay attention",
        text: "Startups usually revisit 409A context around option grants, financing events, material business changes, or equity compensation planning.",
        bullets: ["Issuing employee stock options.", "Closing a priced financing round.", "Material changes in company performance."],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam does not replace qualified 409A, tax, or legal providers. It helps founders understand fundraising valuation context before those workflows intersect.",
        bullets: ["Fundraising valuation range.", "Assumption documentation.", "Report context for advisors and counsel."],
      },
    ],
    faqs: [
      {
        question: "Is Evaldam a 409A provider?",
        answer: "No. Evaldam is a startup valuation and reporting workflow for fundraising preparation. Formal 409A work should be handled by qualified providers.",
      },
      {
        question: "Why do founders compare 409A and fundraising valuation?",
        answer: "They both mention company value, but they are built for different securities, audiences, and decisions. Treating them as interchangeable can create confusion.",
      },
    ],
    relatedGuides: [
      { title: "409A vs Fundraising Valuation", href: "/blog/409a-vs-fundraising-valuation" },
      { title: "When Startups Need a 409A Valuation", href: "/blog/startup-needs-409a-valuation" },
    ],
  },
};

export function getPillarPageMetadata(slug: PillarPageSlug): Metadata {
  const page = pillarPages[slug];
  const url = `https://equidamai.com/${page.slug}`;

  return {
    title: page.title,
    description: page.description,
    keywords: [page.keyword, "startup valuation", "founder valuation", "fundraising valuation", "Evaldam AI"],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      type: "website",
      url,
      siteName: "Evaldam AI",
      images: [
        {
          url: "https://equidamai.com/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${page.title} | Evaldam AI`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["https://equidamai.com/opengraph-image"],
    },
  };
}

export function PillarLandingPage({ slug }: { slug: PillarPageSlug }) {
  const page = pillarPages[slug];
  const url = `https://equidamai.com/${page.slug}`;
  const webpageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: page.title,
    description: page.description,
    url,
    publisher: { "@id": "https://equidamai.com/#organization" },
    author: {
      "@type": "Organization",
      name: authoritySignals.authorName,
      url: authoritySignals.authorUrl,
      description: authoritySignals.authorBio,
    },
    about: page.keyword,
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />

      <main>
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">{page.keyword}</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-gray-950 md:text-6xl">{page.title}</h1>
              <p className="mt-6 text-lg leading-8 text-gray-700">{page.intro}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/free-valuation" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90">
                  Get your valuation range in 2 minutes <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/methodology" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-900 hover:border-primary hover:text-primary">
                  Review methodology <BookOpen className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3 md:py-16">
          {page.sections.map((section) => (
            <article key={section.title} className="border border-gray-200 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">{section.text}</p>
              <ul className="mt-4 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm leading-6 text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_340px]">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <h2 className="text-2xl font-bold text-gray-950">Founder questions</h2>
              </div>
              <div className="mt-5 grid gap-4">
                {page.faqs.map((faq) => (
                  <div key={faq.question} className="border-l-4 border-primary bg-white p-4">
                    <h3 className="font-bold text-gray-950">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Related guides</p>
              <div className="mt-4 space-y-3">
                {page.relatedGuides.map((guide) => (
                  <Link key={guide.href} href={guide.href} className="block border-b border-gray-200 pb-3 text-sm font-bold leading-6 text-gray-900 hover:text-primary">
                    {guide.title}
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Evaldam AI</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-950">Turn the topic into a company-specific range</h2>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Use the free valuation preview when you need a starting range, then create the full report when you need assumptions, comparables, scenarios, and investor-ready output.
            </p>
            <Link href="/free-valuation" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90">
              Generate my valuation range <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
