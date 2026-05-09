import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-10 md:mt-16 py-6 md:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Evaldam AI" width={22} height={22} className="rounded" />
          <span className="font-bold text-gray-700">Evaldam AI</span>
          <span className="hidden md:inline">- AI-powered startup valuations</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <Link href="/methodology" className="hover:text-gray-800 transition-colors">How It Works</Link>
          <Link href="/pricing" className="hover:text-gray-800 transition-colors">Pricing</Link>
          <Link href="/comparable-companies" className="hover:text-gray-800 transition-colors">Comparables</Link>
          <Link href="/faq" className="hover:text-gray-800 transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-gray-800 transition-colors">Contact</Link>
          <Link href="/privacy" className="hover:text-gray-800 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-800 transition-colors">Terms</Link>
        </div>
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Evaldam AI</p>
      </div>
    </footer>
  );
}

