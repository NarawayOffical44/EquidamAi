"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Startup AI", href: "/india-startup-ai" },
  { label: "Methodology", href: "/methodology" },
  { label: "Comparables", href: "/comparable-companies" },
  { label: "Blog", href: "/blog" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Why Evaldam", href: "/why-evaldam" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="pointer-events-none sticky top-0 z-50 w-full max-w-full px-3 pb-1 pt-3">
      <nav className="pointer-events-auto mx-auto w-full max-w-7xl overflow-hidden rounded-lg border border-gray-300 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
        <div className="px-4 sm:px-5">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md shadow-sm" />
              <span className="text-sm font-black text-gray-900 tracking-tight">evaldam</span>
            </Link>
            <div className="hidden xl:flex items-center gap-1 text-sm font-medium text-gray-600">
              {links.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`);

                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2 transition-colors hover:text-gray-900 ${active ? "text-gray-900" : ""}`}
                  >
                    <span className={`relative inline-block after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-0.5 after:bg-primary after:content-[''] ${active ? "after:opacity-100" : "after:opacity-0"}`}>
                      {l.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="hidden xl:flex items-center gap-3">
              <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Sign in</Link>
              <Link href="/signup" className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90">
                Get Started
              </Link>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md p-2 text-gray-500 hover:text-gray-800 xl:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div id="mobile-navigation" className="xl:hidden border-t border-gray-300 px-5 py-4 space-y-2 rounded-b-lg bg-white">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);

              return (
                <Link key={l.href} href={l.href} className={`block rounded-md px-3 py-2 text-sm font-medium hover:text-gray-900 ${active ? "text-primary" : "text-gray-600"}`} onClick={() => setOpen(false)}>{l.label}</Link>
              );
            })}
            <div className="pt-3 border-t border-gray-300 flex gap-2">
              <Link href="/login" className="flex-1 rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-700">
                Sign in
              </Link>
              <Link href="/signup" className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-bold text-white">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
