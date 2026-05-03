"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Methodology", href: "/methodology" },
  { label: "Comparables", href: "/comparable-companies" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Valuation Report", href: "/valuation-report" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-50 px-4 pt-3 pb-1 pointer-events-none">
      <nav className="pointer-events-auto max-w-7xl mx-auto bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-lg">
        <div className="px-5">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Evaldam AI" width={30} height={30} className="rounded-md" />
              <span className="text-sm font-black text-gray-900 tracking-tight">evaldam</span>
            </Link>
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-gray-900 transition-colors">{l.label}</Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Sign in</Link>
              <Link href="/signup">
                <button className="px-5 py-2 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity bg-primary">Get Started</button>
              </Link>
            </div>
            <button className="md:hidden p-2 text-gray-500" onClick={() => setOpen(!open)}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-gray-100 px-5 py-4 space-y-3 rounded-b-2xl bg-white/95">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <Link href="/login" className="flex-1"><button className="w-full py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg">Sign in</button></Link>
              <Link href="/signup" className="flex-1"><button className="w-full py-2 text-sm font-bold text-white rounded-lg bg-primary">Get Started</button></Link>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
