import Link from "next/link";
import Image from "next/image";

const footerGroups = [
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog", featured: true },
      { href: "/methodology", label: "How It Works" },
      { href: "/comparable-companies", label: "Comparables" },
      { href: "/case-studies", label: "Case Studies" },
      { href: "/api-docs", label: "API Docs" },
    ],
  },
  {
    title: "Product",
    links: [
      { href: "/free-valuation", label: "Free Startup Valuation Calculator" },
      { href: "/github-valuation", label: "GitHub Valuation" },
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 bg-[#f6f9fb] py-9 text-gray-600 md:mt-16 md:py-11">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:gap-12">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Evaldam AI" width={28} height={28} className="rounded-md" />
              <span className="text-sm font-black text-gray-900">Evaldam AI</span>
            </div>
            <div className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
              Defensible startup valuations for founders, advisors, accelerators, and VCs. Use Evaldam as a startup valuation consultant alternative for seed round valuation, SAFE valuation cap planning, and startup valuation report workflows.
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

        <div className="mt-8 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Evaldam AI
        </div>
      </div>
    </footer>
  );
}
