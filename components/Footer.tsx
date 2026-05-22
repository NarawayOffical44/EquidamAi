import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-gray-300 mt-10 md:mt-16 py-6 md:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid gap-8 text-sm text-gray-500 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Evaldam AI" width={22} height={22} className="rounded" />
              <span className="font-bold text-gray-700">Evaldam AI</span>
            </div>
            <p className="mt-3 max-w-sm leading-6">
              Defensible startup valuations for founders, advisors, accelerators, and VCs. Use Evaldam as a startup valuation consultant alternative for seed round valuation, SAFE valuation cap planning, and startup valuation report workflows.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-wide text-gray-900">Resources</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/blog" className="font-bold text-primary hover:opacity-80 transition-opacity">Blog</Link>
              <Link href="/methodology" className="hover:text-gray-800 transition-colors">How It Works</Link>
              <Link href="/comparable-companies" className="hover:text-gray-800 transition-colors">Comparables</Link>
              <Link href="/case-studies" className="hover:text-gray-800 transition-colors">Case Studies</Link>
              <Link href="/api-docs" className="hover:text-gray-800 transition-colors">API Docs</Link>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-wide text-gray-900">Product</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/free-valuation" className="hover:text-gray-800 transition-colors">Free Startup Valuation Calculator</Link>
              <Link href="/github-valuation" className="hover:text-gray-800 transition-colors">GitHub Valuation</Link>
              <Link href="/pricing" className="hover:text-gray-800 transition-colors">Pricing</Link>
              <Link href="/faq" className="hover:text-gray-800 transition-colors">FAQ</Link>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-wide text-gray-900">Company</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/contact" className="hover:text-gray-800 transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-gray-800 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-800 transition-colors">Terms</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-300 pt-5">
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Evaldam AI</p>
        </div>
      </div>
    </footer>
  );
}
