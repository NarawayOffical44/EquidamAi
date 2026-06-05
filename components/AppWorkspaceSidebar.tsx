"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type AppWorkspaceSidebarItem = {
  label: string;
  Icon: LucideIcon;
  href?: string;
  active?: boolean;
  dividerBefore?: boolean;
  onClick?: () => void;
};

type AppWorkspaceSidebarProps = {
  items: AppWorkspaceSidebarItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AppWorkspaceSidebar({ items, isOpen, onOpenChange }: AppWorkspaceSidebarProps) {
  return (
    <aside
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
      className={`fixed inset-y-0 left-0 z-40 hidden overflow-visible flex-col border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex ${isOpen ? "w-64" : "w-20"}`}
    >
      <div className={`relative flex h-16 items-center border-b border-slate-200 bg-white ${isOpen ? "justify-start px-5" : "justify-center px-3"}`}>
        <div className={`flex min-w-0 items-center gap-3 ${isOpen ? "" : "justify-center"}`}>
          <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-xl" />
          {isOpen && (
            <div>
              <p className="text-sm font-bold leading-tight text-gray-900">Evaldam AI</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`flex-1 space-y-1 py-4 ${isOpen ? "px-3" : "px-2"}`}>
        {items.map(({ label, href, Icon, active, onClick, dividerBefore }) => {
          const className = `flex w-full items-center rounded-xl py-2.5 text-left text-sm font-semibold transition-all ${isOpen ? "gap-3 px-3" : "justify-center px-2"} ${
            active
              ? "border-l-2 border-primary bg-primary/5 text-primary"
              : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
          }`;

          if (href) {
            return (
              <div key={label}>
                {dividerBefore && <div className="my-3 border-t border-slate-200" />}
                <Link href={href} title={isOpen ? undefined : label} className={className}>
                  <Icon className="h-4 w-4" />
                  {isOpen && label}
                </Link>
              </div>
            );
          }

          return (
            <div key={label}>
              {dividerBefore && <div className="my-3 border-t border-slate-200" />}
              <button type="button" onClick={onClick} title={isOpen ? undefined : label} className={className}>
                <Icon className="h-4 w-4" />
                {isOpen && label}
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
