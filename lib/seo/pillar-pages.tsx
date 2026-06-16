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
  // Note: Each pillar now contains expanded, unique explanatory text (800+ words of original prose per page when rendered) to address thin/templated content flags.
  // Content is deliberately varied per topic with specific examples, founder scenarios, and detailed methodology ties rather than generic boilerplate.
  "pre-money-vs-post-money-valuation": {
    slug: "pre-money-vs-post-money-valuation",
    keyword: "pre-money vs post-money valuation",
    title: "Pre-Money vs Post-Money Valuation for Founders",
    description:
      "Understand pre-money vs post-money valuation, ownership impact, dilution, SAFE conversion context, and what founders should clarify before investor conversations.",
    intro:
      "Pre-money and post-money valuation sound similar, but they answer different ownership questions. Founders need both numbers clear before comparing offers, round size, and dilution. The distinction affects how much of the company you give up, how future rounds are sized, and whether your cap table stays founder-friendly through multiple financings.",
    sections: [
      {
        title: "What the difference changes",
        text: "Pre-money valuation is the company value before new capital. Post-money valuation includes the new investment and usually drives investor ownership. The gap between the two directly determines dilution for founders and existing shareholders. A $10M pre-money round of $2M creates a $12M post-money, giving new investors roughly 16.7% before any option pool or convertible adjustments. Changing the pre-money number or round size shifts ownership percentages immediately. This is why founders must model both numbers together before any term sheet arrives.",
        bullets: [
          "Round size changes the post-money number and therefore the ownership slice investors receive.",
          "Option pool changes can shift founder dilution even when the headline valuation stays the same.",
          "SAFE notes and convertible instruments often convert using post-money mechanics, creating surprise dilution layers.",
        ],
      },
      {
        title: "What founders should prepare",
        text: "A defensible range is stronger than a single headline number because investors will test assumptions and ownership outcomes during diligence. Prepare low, base, and high scenarios that show how dilution moves with different round sizes, pool expansions, and prior instrument conversions. Model the cap table before and after the round so you can explain founder ownership, investor economics, and remaining option pool headroom in plain language.",
        bullets: [
          "Low, base, and high valuation range backed by comparable stage data and your specific traction signals.",
          "Expected dilution by round size and option pool expansion, including sensitivity tables.",
          "Existing notes, SAFEs, and option pool impact on the final founder ownership percentage.",
        ],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam turns stage, traction, market context, and assumptions into a valuation range founders can discuss before term sheets arrive. The platform runs multiple professional methods in parallel, surfaces the assumptions behind each result, and exports an investor-ready PDF that includes the full evidence trail. This lets you walk into conversations with ownership scenarios already modeled instead of reacting to the first offer on the table.",
        bullets: [
          "Six valuation methods (Scorecard, Berkus, VC Method, DCF variants, and blended scoring) applied to your actual data.",
          "Assumptions trail and sensitivity analysis so investors can see how the range moves with 20% changes in key inputs.",
          "Investor-ready PDF report that documents the range, comparables, and cap table implications in one place.",
        ],
      },
    ],
    faqs: [
      {
        question: "Which number should founders negotiate?",
        answer: "Founders should understand both, but ownership normally depends on the post-money outcome after investment, option pool, and conversion mechanics. Negotiate the pre-money number while modeling the full post-money ownership and dilution impact before signing.",
      },
      {
        question: "Can pre-money and post-money confusion cause dilution surprises?",
        answer: "Yes. A strong headline valuation can still lead to unexpected dilution if the round size, option pool, or convertible instruments are not modeled clearly. Always run the post-money math and cap table scenarios before accepting a term sheet.",
      },
      {
        question: "How do SAFEs interact with pre- and post-money valuation?",
        answer: "Most SAFEs convert using post-money valuation caps or discounts. This means the effective ownership investors receive is calculated on the post-money number, which can increase founder dilution beyond what the headline pre-money suggests.",
      },
      {
        question: "Should I push for a higher pre-money or focus on post-money terms?",
        answer: "Push for a pre-money number that, after modeling round size, pool, and convertibles, still leaves you with acceptable ownership and future fundraising flexibility. The post-money outcome and your resulting cap table matter more than the pre-money headline alone.",
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
      "A startup valuation is not only a company price. It becomes a cap table outcome: who owns what before and after the round, and whether the company remains financeable. Investors rarely look at valuation in isolation. They examine the full ownership map, prior dilution, option pool pressure, and how the new round will reshape founder and employee incentives over the next 18–24 months.",
    sections: [
      {
        title: "Why valuation and ownership connect",
        text: "Investors review valuation alongside founder ownership, option pool needs, prior financing, and future dilution risk. A $12M post-money round that expands the option pool by 15% can leave founders with less ownership than a $10M round with a smaller pool. The cap table tells the real story of how much of the company you still control after the money arrives and how much room remains for future hires and financings. This is why a clean, well-modeled cap table is often more persuasive than the valuation number alone.",
        bullets: [
          "Founder ownership after the round, including the impact of any new option pool creation.",
          "Existing investor rights, liquidation preferences, and conversion terms that interact with the new valuation.",
          "Option pool size before and after financing and how it affects employee equity grants and future dilution.",
        ],
      },
      {
        title: "Signals investors notice",
        text: "A clean cap table makes the valuation easier to trust because ownership, incentives, and future financing needs are easier to understand. Messy historical grants, large advisor allocations without clear milestones, or unclear convertible terms raise questions about how disciplined the founding team has been with equity. Investors use the cap table to test whether the proposed valuation leaves the company with enough ownership runway to attract the next round of talent and capital.",
        bullets: [
          "Unusual advisor grants or early large allocations that suggest poor equity discipline.",
          "Too much early dilution that leaves founders with limited skin in the game for the next several years.",
          "Missing or unclear convertible instrument terms that can create unexpected ownership shifts at the next priced round.",
        ],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam helps founders connect valuation assumptions to investor-ready context, then document the range and reasoning before discussions. You can model different round sizes, pool expansions, and convertible conversion scenarios inside the same workspace, then export a single report that shows both the valuation range and the resulting cap table outcomes. This preparation turns valuation conversations from reactive negotiations into evidence-based discussions.",
        bullets: [
          "Valuation range before dilution modeling, with clear low-base-high scenarios tied to your traction and market data.",
          "Scenario and sensitivity analysis that shows ownership impact under different round sizes and pool assumptions.",
          "Report-ready assumptions and evidence that you can share directly with investors, advisors, or counsel.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does Evaldam replace cap table software?",
        answer: "No. Evaldam focuses on valuation ranges and investor-ready reporting. Cap table software remains the right system of record for ownership administration, vesting schedules, and legal equity tracking. Use Evaldam to model the valuation and ownership outcomes that feed into your cap table discussions.",
      },
      {
        question: "Why does the cap table affect valuation conversations?",
        answer: "A cap table can reveal dilution risk, incentive problems, option pool pressure, and terms that affect how much ownership investors receive. Investors will use the cap table to pressure-test whether the valuation you are discussing is realistic given historical grants and future hiring needs.",
      },
      {
        question: "How far in advance should founders model cap table outcomes before a round?",
        answer: "Model at least three scenarios (conservative, base, and aggressive round size and pool) as soon as you have a valuation range. This lets you negotiate from a position of clarity rather than reacting to the first term sheet draft.",
      },
      {
        question: "What cap table red flags most often surprise founders during valuation talks?",
        answer: "Large historical advisor or early-employee grants without performance conditions, missing documentation on prior SAFEs, and option pool discussions that happen after the valuation headline is agreed. Modeling these early prevents last-minute ownership surprises.",
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
      "A SAFE valuation cap sets the maximum valuation used for conversion in a future priced round. The cap can shape investor ownership even before the priced round exists. Choosing the right cap is one of the earliest and most consequential decisions founders make because it locks in a ceiling on investor economics while the company is still proving itself. Too low and you may give away more ownership than necessary; too high and you may struggle to close the round or create misaligned expectations with early backers.",
    sections: [
      {
        title: "What the cap controls",
        text: "The cap protects early investors if the next priced round is higher. It can create meaningful dilution when the company later raises at a premium. When a priced round occurs above the cap, SAFE holders convert at the lower cap valuation (or the discount, whichever is better for them). This math directly reduces the ownership slice available to founders and employees who joined after the SAFE round. Stacking multiple SAFEs with different caps compounds the effect.",
        bullets: [
          "Conversion valuation ceiling that determines the price at which early capital converts into equity.",
          "Investor ownership at the priced round, which can be higher than the headline post-money suggests once all caps and discounts are applied.",
          "Interaction with discounts and MFN terms that can further improve conversion terms for SAFE holders in certain scenarios.",
        ],
      },
      {
        title: "What founders should model",
        text: "A cap should be tested against expected round size, future valuation, existing SAFEs, and the ownership founders need to keep building. Run scenarios that show founder ownership after conversion under conservative, base, and aggressive next-round valuations. Factor in any existing SAFE stack, planned option pool expansion, and the minimum ownership you need to retain for the next 18–24 months of hiring and fundraising. The goal is a cap that is credible to investors yet protects founder economics.",
        bullets: [
          "Cap versus expected next round size and post-money valuation, including sensitivity to 20–30% valuation swings.",
          "Multiple SAFE stack impact so you can see cumulative dilution from the entire early-capital layer.",
          "Founder ownership after conversion under different round outcomes and pool sizes.",
        ],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam gives founders a structured valuation range before they discuss caps, discounts, and investor ownership. You can model the impact of different cap levels against your current traction and market data, then export the full set of assumptions and resulting ownership scenarios. This preparation turns cap negotiations from a single number conversation into a documented discussion of risk, dilution, and future financing headroom.",
        bullets: [
          "Stage-aware valuation methods that produce a credible range you can defend when setting or negotiating the cap.",
          "Assumptions and risk notes that show investors how you arrived at the proposed cap and what would change the outcome.",
          "Investor-ready report context that includes dilution scenarios and cap table implications for the entire SAFE stack.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is a lower SAFE valuation cap always better for investors?",
        answer: "Usually it gives investors more upside on conversion, but founders should evaluate whether the dilution and future fundraising signal are acceptable. A very low cap can make the round harder to close or signal that the company is struggling to command market valuation.",
      },
      {
        question: "Should founders set a SAFE cap from a valuation range?",
        answer: "A valuation range helps founders understand the cap negotiation, but legal and financing terms should be reviewed with qualified counsel. Use the range to model ownership outcomes, then work with your lawyer to draft terms that are fair to both sides and support future rounds.",
      },
      {
        question: "How do MFN and discount terms interact with the valuation cap?",
        answer: "MFN (most favored nation) and discount terms can improve conversion economics for SAFE holders beyond the cap alone. Always model the best-case conversion for investors (lowest effective price) when setting the cap so you understand the maximum dilution scenario.",
      },
      {
        question: "What happens if the next round is below the SAFE cap?",
        answer: "If the priced round is below the cap, conversion usually happens at the lower round price (or the discount, whichever benefits the investor more). This protects early investors but can create larger dilution than expected for founders.",
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
      "The valuation in a term sheet is only one part of founder economics. Option pools, liquidation preferences, investor rights, and conversion mechanics can change the real outcome. A headline $15M pre-money term sheet can still leave founders with less than 50% after the round once the option pool is expanded, liquidation preferences are applied, and any prior convertibles are factored in. The real economics live in the full set of terms, not the single number at the top of the page.",
    sections: [
      {
        title: "What to read beyond the headline price",
        text: "Founders should connect valuation to the terms that decide ownership, proceeds, control, and future fundraising flexibility. The pre-money or post-money basis, the size of any new option pool, the liquidation preference (1x, 2x, participating), and how prior SAFEs or notes convert all interact with the valuation number to determine what you actually own and what you would receive in different exit scenarios.",
        bullets: [
          "Pre-money or post-money basis and how it interacts with the new money and any option pool creation.",
          "Option pool expansion that is often carved out of the pre-money valuation and directly reduces founder ownership.",
          "Liquidation preference and participation rights that can dramatically change founder proceeds even at the same headline valuation.",
        ],
      },
      {
        title: "What investors are testing",
        text: "Investors want a valuation that can be defended with evidence and that leaves the company able to raise the next round. They will pressure-test traction quality, market size claims, comparable context, use of funds, and whether the team has a realistic milestone plan that justifies the number. A valuation that looks aggressive without supporting data often leads to tougher terms elsewhere in the sheet to compensate.",
        bullets: [
          "Traction quality and whether the metrics support the growth assumptions baked into the valuation.",
          "Market and comparable context that shows the number is reasonable relative to recent deals in the same stage and geography.",
          "Use of funds and milestone plan that demonstrate the capital will meaningfully de-risk the company for the next round.",
        ],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam helps founders prepare the valuation evidence before a term sheet becomes the negotiation anchor. You can run the full set of methods against your current data, model the ownership and proceeds impact of different term structures, and export a single report that documents assumptions, comparables, and sensitivity. This preparation lets you respond to the first term sheet with your own data rather than starting from zero.",
        bullets: [
          "Valuation method breakdown with clear assumptions so you can defend the range during term sheet discussions.",
          "Comparable reasoning and sensitivity analysis that shows how the number moves with realistic changes in inputs.",
          "Sensitivity analysis and PDF export that you can use internally or share with counsel and advisors before signing.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can a term sheet valuation be misleading?",
        answer: "Yes. The headline valuation can look attractive while other terms shift dilution, downside protection, or founder economics. Always model the full post-money cap table and liquidation scenarios before agreeing to the number.",
      },
      {
        question: "What should founders prepare before reviewing valuation terms?",
        answer: "Founders should prepare a valuation range, assumptions, dilution scenarios, cap table context, and milestones supported by the round. Having this ready turns the term sheet conversation from a one-sided negotiation into a data-driven discussion.",
      },
      {
        question: "How do liquidation preferences change the effective valuation for founders?",
        answer: "A 1x non-participating preference is standard and relatively founder-friendly. Participating preferences or higher multiples can mean investors get their money back plus a share of the upside, which effectively reduces the valuation at which founders start receiving proceeds.",
      },
      {
        question: "Should I push back on the valuation or on other terms in the sheet?",
        answer: "Push on the combination that gives you acceptable ownership and future flexibility. Sometimes a slightly lower headline valuation with better liquidation terms, smaller pool, or cleaner rights is better for founders than a higher number with heavy preferences.",
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
      "A 409A valuation and a fundraising valuation serve different purposes. US startups often need 409A context for common stock and options, while investors negotiate preferred-stock economics. The 409A sets a defensible fair market value for tax and compensation purposes. The fundraising number is a negotiated price for preferred stock with rights and protections that common stock does not have. Confusing the two or treating them as interchangeable can create tax, legal, and dilution issues later.",
    sections: [
      {
        title: "Why the numbers can differ",
        text: "409A work generally supports common stock fair market value using methods acceptable to the IRS and option plan administrators. Fundraising valuation reflects investor terms, preferred economics, growth expectations, and negotiation context. The same company can have a $8M 409A and a $12M pre-money fundraising valuation at the same moment because the two processes optimize for different audiences and risk profiles. Option grants priced at the 409A number must be defended as arm's-length; investor preferred economics are set through negotiation.",
        bullets: [
          "Common stock versus preferred stock economics and the different risk/return profiles each security carries.",
          "Employee option pricing context that must stay compliant with tax rules even while fundraising negotiations move the preferred price.",
          "Fundraising expectations and investor rights that are layered on top of the common stock value determined by 409A.",
        ],
      },
      {
        title: "When founders should pay attention",
        text: "Startups usually revisit 409A context around option grants, financing events, material business changes, or equity compensation planning. A material financing, new product launch, or significant customer win can change the 409A number and trigger a new valuation. Ignoring the interaction between 409A and fundraising can lead to option repricing issues, tax complications for employees, or investor questions about why the numbers appear inconsistent.",
        bullets: [
          "Issuing employee stock options or refreshing option pools at the current 409A fair market value.",
          "Closing a priced financing round that changes the company's stage and risk profile for the next 409A.",
          "Material changes in company performance, market conditions, or competitive landscape that affect both 409A and fundraising numbers.",
        ],
      },
      {
        title: "How Evaldam helps",
        text: "Evaldam does not replace qualified 409A, tax, or legal providers. It helps founders understand fundraising valuation context before those workflows intersect. You can generate a defensible fundraising range with full methodology and assumptions documented, then share that context with your 409A provider, counsel, or board. This preparation reduces last-minute surprises when the 409A and fundraising processes run in parallel.",
        bullets: [
          "Fundraising valuation range with documented assumptions that you can provide to 409A providers for context.",
          "Assumption documentation and sensitivity analysis that shows how the range responds to different inputs.",
          "Report context for advisors and counsel that makes the connection between fundraising goals and common stock considerations clearer.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Evaldam a 409A provider?",
        answer: "No. Evaldam is a startup valuation and reporting workflow for fundraising preparation. Formal 409A work should be handled by qualified providers who are responsible for the tax and compliance aspects of common stock fair market value.",
      },
      {
        question: "Why do founders compare 409A and fundraising valuation?",
        answer: "They both mention company value, but they are built for different securities, audiences, and decisions. Treating them as interchangeable can create confusion with employees, the board, or future investors. Understanding the differences helps you communicate clearly and avoid tax or legal surprises.",
      },
      {
        question: "Can a fundraising valuation affect future 409A numbers?",
        answer: "Yes. A priced round at a new valuation often becomes a significant input for the next 409A. Large gaps between the two numbers can trigger questions from the 409A provider or the IRS, so founders should document the reasoning behind both.",
      },
      {
        question: "What should founders do if the 409A comes in much lower than the fundraising valuation?",
        answer: "Work with qualified 409A counsel and your board to understand the drivers. In some cases a new 409A is required after the round; in others you may need to explain the difference to employees receiving options. Using Evaldam to model both the fundraising and common stock implications in advance reduces the chance of surprises.",
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
