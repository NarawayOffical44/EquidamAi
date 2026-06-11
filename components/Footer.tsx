import Link from "next/link";
import Image from "next/image";
import Script from "next/script";

const footerGroups = [
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog", featured: true },
      { href: "/methodology", label: "How It Works" },
      { href: "/comparable-companies", label: "Comparables" },
      { href: "/startup-valuation-benchmarks", label: "Benchmarks" },
      { href: "/case-studies", label: "Case Studies" },
      { href: "/api-docs", label: "API Docs" },
    ],
  },
  {
    title: "Product",
    links: [
      { href: "/free-valuation", label: "Free Startup Valuation Calculator" },
      { href: "/github-valuation", label: "GitHub Valuation" },
      { href: "/india-startup-ai", label: "Startup AI" },
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

const socialLinks = [
  { href: "https://x.com/evaldam", label: "Follow Evaldam AI on X", shortLabel: "X" },
  {
    href: "https://www.producthunt.com/products/evaldam-ai?utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-evaldam-ai",
    label: "View Evaldam AI on Product Hunt",
    shortLabel: "PH",
  },
];

export function Footer() {
  return (
    <>
      <footer className="mt-12 bg-[#f6f9fb] py-9 text-gray-600 md:mt-16 md:py-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:gap-12">
            <div className="max-w-md">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Evaldam AI" width={28} height={28} className="rounded-md" />
                <span className="text-sm font-black text-gray-900">Evaldam AI</span>
              </div>
              <div className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
                The startup valuation platform and founder journey assistant — six proven valuation methods, an AI that guides fundraising, dilution, and terms, investor-ready reports you can share, and a live record of your valuation over time.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <div className="text-[11px] font-black uppercase tracking-widest text-gray-900">{group.title}</div>
                  <div className="mt-3 grid gap-2.5">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`text-sm font-medium transition-colors ${
                          link.featured ? "text-primary hover:text-primary/80" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <div>&copy; {new Date().getFullYear()} Evaldam AI</div>
            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-black text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50"
                >
                  {link.shortLabel}
                </a>
              ))}
              <div className="w-full min-w-0 max-w-sm sm:min-w-[250px]">
                <div
                  className="trustpilot-widget"
                  data-locale="en-US"
                  data-template-id="56278e9abfbbba0bdcd568bc"
                  data-businessunit-id="6a1dc3083d4303165a62fca8"
                  data-style-height="52px"
                  data-style-width="100%"
                  data-token="8d639316-0df4-46e1-aa99-7de8320e4e5e"
                >
                  <a href="https://www.trustpilot.com/review/equidamai.com" target="_blank" rel="noopener noreferrer">
                    Trustpilot
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <Script
        id="trustpilot-widget-bootstrap"
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
      />
    </>
  );
}
