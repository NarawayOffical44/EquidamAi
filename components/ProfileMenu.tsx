"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, Settings, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearStartupAiChatHistory } from "@/lib/india-finance-ai/chat-storage";

interface ProfileMenuProps {
  userInfo?: { full_name?: string; email?: string; [key: string]: any };
  userName: string;
  userInitial: string;
  onSettingsOpen: () => void;
  position?: "left-6" | "left-64" | "left-80"; // left-6 for dashboard, left-64/left-80 for workspace
  variant?: "fixed" | "inline";
}

export function ProfileMenu({
  userInfo,
  userName,
  userInitial,
  onSettingsOpen,
  position = "left-6",
  variant = "fixed",
}: ProfileMenuProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    if (signingOut) return;

    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Signout error:", error.message);
        throw error;
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearStartupAiChatHistory();
      setProfileMenuOpen(false);
      router.push("/");
    }
  };

  const isInline = variant === "inline";

  return (
    <div className={`${isInline ? "relative z-40" : `fixed bottom-6 ${position} z-40`}`}>
      {profileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setProfileMenuOpen(false)}
          />
          <div className={`absolute w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg z-40 ${
            isInline ? "right-0 top-full mt-2" : "bottom-full left-0 mb-3"
          }`}>
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userInfo?.full_name || userName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                onSettingsOpen();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" /> Settings
            </button>
            <Link href="/pricing" className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50">
              <Sparkles className="w-4 h-4 text-primary" /> Upgrade Plan
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className={`${isInline ? "h-9 px-2.5" : "px-3 py-2.5 shadow-md hover:shadow-lg"} flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white transition-all hover:border-gray-300`}
      >
        <div className={`${isInline ? "h-7 w-7" : "h-8 w-8"} bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
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
