"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Sparkles, ChevronUp } from "lucide-react";

interface ProfileMenuProps {
  userInfo?: { full_name?: string; email?: string; [key: string]: any };
  userName: string;
  userInitial: string;
  onSettingsOpen: () => void;
  position?: "left-6" | "left-64"; // left-6 for dashboard, left-64 for workspace with sidebar
}

export function ProfileMenu({
  userInfo,
  userName,
  userInitial,
  onSettingsOpen,
  position = "left-6",
}: ProfileMenuProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <div className={`fixed bottom-6 ${position} z-40`}>
      {profileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setProfileMenuOpen(false)}
          />
          <div className="absolute bottom-full mb-3 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-40">
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userInfo?.full_name || userName}
              </p>
            </div>
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                onSettingsOpen();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" /> Settings
            </button>
            <Link href="/pricing" className="w-full">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                <Sparkles className="w-4 h-4 text-primary" /> Upgrade Plan
              </button>
            </Link>
          </div>
        </>
      )}
      <button
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-md hover:shadow-lg hover:border-gray-300 transition-all"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {userInitial}
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">
          {userName}
        </span>
        <ChevronUp
          className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${
            profileMenuOpen ? "rotate-0" : "rotate-180"
          }`}
        />
      </button>
    </div>
  );
}
