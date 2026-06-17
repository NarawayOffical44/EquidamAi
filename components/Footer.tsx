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
  {
    href: "https://x.com/EquidamAi",
    label: "Follow Evaldam AI on X",
    color: "hover:bg-black hover:text-white hover:border-black",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  {
    href: "https://www.youtube.com/@EvaldamAi",
    label: "Watch Evaldam AI on YouTube",
    color: "hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com/evaldamai",
    label: "Follow Evaldam AI on Instagram",
    color: "hover:bg-[#E1306C] hover:text-white hover:border-[#E1306C]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    href: "https://linkedin.com/company/evaldamai",
    label: "Follow Evaldam AI on LinkedIn",
    color: "hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
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
              {/* Social icon buttons */}
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-all ${link.color}`}
                >
                  {link.icon}
                </a>
              ))}

              {/* Product Hunt badge */}
              <a
                href="https://www.producthunt.com/products/evaldam-ai?utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-evaldam-ai"
                target="_blank"
                rel="noreferrer"
                aria-label="View Evaldam AI on Product Hunt"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#DA552F]/30 bg-white px-2.5 text-xs font-bold text-[#DA552F] transition-all hover:bg-[#DA552F] hover:text-white hover:border-[#DA552F]"
              >
                <svg viewBox="0 0 26 26" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
                  <path d="M13 0C5.82 0 0 5.82 0 13s5.82 13 13 13 13-5.82 13-13S20.18 0 13 0zm2.017 17.01H10.34V14.5h4.677c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25H10.34V9.49h4.677c1.939 0 3.51 1.572 3.51 3.51s-1.571 3.51-3.51 3.51z" />
                </svg>
                Product Hunt
              </a>

              {/* Trustpilot widget */}
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
