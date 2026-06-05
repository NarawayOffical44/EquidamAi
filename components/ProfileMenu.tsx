"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, Settings, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearStartupAiChatHistory } from "@/lib/india-finance-ai/chat-storage";

interface ProfileMenuProps {
  userInfo?: { full_name?: string; email?: string; [key: string]: any };
  userName: string;
  userInitial: string;
  onSettingsOpen: () => void;
  position?: "left-6" | "left-64" | "left-80";
  variant?: "fixed" | "inline";
  planLabel?: string;
  planDetail?: string;
  compactButton?: boolean;
}

const menuActionClassName =
  "flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50";
const separatedMenuActionClassName = `${menuActionClassName} border-t border-gray-100`;

export function ProfileMenu({
  userInfo,
  userName,
  userInitial,
  onSettingsOpen,
  position = "left-6",
  variant = "fixed",
  planLabel,
  planDetail,
  compactButton = false,
}: ProfileMenuProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const avatarUrl = typeof userInfo?.avatar_url === "string" ? userInfo.avatar_url : "";

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
      setConfirmSignOut(false);
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
          <div className={`absolute w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-40 ${
            isInline ? "right-0 top-full mt-2" : "bottom-full left-0 mb-3"
          }`}>
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-primary">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" width={36} height={36} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {userInitial}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {userInfo?.full_name || userName}
                  </p>
                  {userInfo?.email && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">{userInfo.email}</p>
                  )}
                </div>
              </div>
              {planLabel && (
                <div className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-500">Plan</span>
                    <span className="rounded-lg border border-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {planLabel}
                    </span>
                  </div>
                  {planDetail && <p className="mt-1 text-xs text-gray-500">{planDetail}</p>}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                onSettingsOpen();
              }}
              className={menuActionClassName}
            >
              <Settings className="w-4 h-4 text-gray-400" /> Settings
            </button>
            <Link href="/subscription" onClick={() => setProfileMenuOpen(false)} className={separatedMenuActionClassName}>
              <Sparkles className="w-4 h-4 text-primary" /> Upgrade Plan
            </Link>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setConfirmSignOut(true);
              }}
              disabled={signingOut}
              className={`${separatedMenuActionClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </>
      )}
      {confirmSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Sign out?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              You will leave the current workspace and return to the public site.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSignOut(false)}
                disabled={signingOut}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className={`${isInline ? "h-9 px-2.5" : compactButton ? "px-2 py-2 shadow-md hover:shadow-lg" : "px-3 py-2.5 shadow-md hover:shadow-lg"} flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white transition-all hover:border-gray-300`}
      >
        <div className={`${isInline ? "h-7 w-7" : "h-8 w-8"} overflow-hidden rounded-full bg-primary flex-shrink-0`}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
              {userInitial}
            </div>
          )}
        </div>
        <span className={`${compactButton ? "hidden" : "hidden sm:block"} max-w-[120px] truncate text-sm font-medium text-gray-700`}>
          {userName}
        </span>
        <ChevronUp
          className={`${compactButton ? "hidden" : "hidden sm:block"} h-4 w-4 text-gray-400 transition-transform ${
            profileMenuOpen ? "rotate-0" : "rotate-180"
          }`}
        />
      </button>
    </div>
  );
}
