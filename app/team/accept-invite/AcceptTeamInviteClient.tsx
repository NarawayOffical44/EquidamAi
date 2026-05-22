"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
  MailCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type InvitationStatus = "pending" | "accepted" | "rejected" | "revoked";

type InvitationDetails = {
  email: string;
  status: InvitationStatus;
  expiresAt: string | null;
  expired: boolean;
  workspaceOwnerName: string | null;
  workspaceOwnerEmail: string | null;
  inviterName: string | null;
};

type AcceptTeamInviteClientProps = {
  initialCode: string;
};

function buildAuthHref(path: "/login" | "/signup", code: string, email?: string) {
  const params = new URLSearchParams();
  params.set("next", `/team/accept-invite?code=${encodeURIComponent(code)}`);
  if (email) params.set("email", email);
  return `${path}?${params.toString()}`;
}

function formatExpiry(value: string | null) {
  if (!value) return "soon";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AcceptTeamInviteClient({ initialCode }: AcceptTeamInviteClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const invitationCode = initialCode.trim();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupError, setLookupError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [accepted, setAccepted] = useState(false);

  const loadInvitation = useCallback(async () => {
    if (!invitationCode) {
      setLookupError("This invitation link is missing a code.");
      setLookupLoading(false);
      return;
    }

    setLookupLoading(true);
    setLookupError("");
    try {
      const response = await fetch(`/api/team/accept?code=${encodeURIComponent(invitationCode)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invitation not found.");
      setInvitation(data.invitation);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Invitation not found.");
    } finally {
      setLookupLoading(false);
    }
  }, [invitationCode]);

  const loadUser = useCallback(async () => {
    setAuthLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentEmail(user?.email?.trim().toLowerCase() || null);
    setAuthLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadInvitation();
    void loadUser();
  }, [loadInvitation, loadUser]);

  const handleAccept = async () => {
    setAcceptError("");
    setAcceptLoading(true);
    try {
      const response = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to accept invitation.");
      setAccepted(true);
      setInvitation((current) => current ? { ...current, status: "accepted" } : current);
      setTimeout(() => router.replace("/dashboard"), 900);
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : "Failed to accept invitation.");
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentEmail(null);
    router.refresh();
  };

  const ownerLabel =
    invitation?.workspaceOwnerName ||
    invitation?.workspaceOwnerEmail ||
    invitation?.inviterName ||
    "this workspace";
  const invitedEmail = invitation?.email || "";
  const emailMatches = Boolean(
    currentEmail && invitedEmail && currentEmail === invitedEmail.trim().toLowerCase()
  );

  let content: React.ReactNode;

  if (lookupLoading || authLoading) {
    content = (
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">Checking invitation</h1>
        <p className="mt-2 text-sm text-gray-500">We are verifying the invite link and your account session.</p>
      </div>
    );
  } else if (lookupError || !invitation) {
    content = (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Invitation unavailable</h1>
        <p className="mt-2 text-sm text-gray-500">{lookupError || "This invitation could not be found."}</p>
        <Link href="/dashboard" className="btn btn-secondary mt-6 w-full">
          Go to Dashboard
        </Link>
      </div>
    );
  } else if (invitation.expired || invitation.status === "revoked" || invitation.status === "rejected") {
    content = (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Invitation no longer active</h1>
        <p className="mt-2 text-sm text-gray-500">
          Ask the workspace Admin to send a new invitation to {invitedEmail}.
        </p>
      </div>
    );
  } else if (!currentEmail) {
    content = (
      <div>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Accept team invitation</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in with {invitedEmail} to join {ownerLabel}'s Evaldam AI workspace.
        </p>
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{ownerLabel}</p>
              <p className="text-xs text-gray-500">Invite expires {formatExpiry(invitation.expiresAt)}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href={buildAuthHref("/login", invitationCode, invitedEmail)} className="btn btn-primary w-full">
            Sign In
          </Link>
          <Link href={buildAuthHref("/signup", invitationCode, invitedEmail)} className="btn btn-secondary w-full">
            Create Account
          </Link>
        </div>
      </div>
    );
  } else if (!emailMatches) {
    content = (
      <div>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Use the invited email</h1>
        <p className="mt-2 text-sm text-gray-500">
          This invitation was sent to {invitedEmail}. You are signed in as {currentEmail}.
        </p>
        <button type="button" onClick={handleSignOut} className="btn btn-secondary mt-6 w-full gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    );
  } else if (accepted || invitation.status === "accepted") {
    content = (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">You are in</h1>
        <p className="mt-2 text-sm text-gray-500">Your team workspace is ready.</p>
        <Link href="/dashboard" className="btn btn-primary mt-6 w-full gap-2">
          Open Workspace
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  } else {
    content = (
      <div>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Join {ownerLabel}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Accept this invitation to access shared startup profiles, valuations, and reports.
        </p>
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-500">Signed in as</span>
            <span className="break-all text-right text-sm font-semibold text-gray-900">{currentEmail}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4">
            <span className="text-sm text-gray-500">Expires</span>
            <span className="text-sm font-semibold text-gray-900">{formatExpiry(invitation.expiresAt)}</span>
          </div>
        </div>
        {acceptError && (
          <div className="alert alert-error mt-5">
            <span>{acceptError}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleAccept}
          disabled={acceptLoading}
          className="btn btn-primary mt-6 w-full gap-2"
        >
          {acceptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Accept Invitation
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:flex sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image src="/logo.png" alt="Evaldam AI" width={42} height={42} className="rounded-xl" />
          </Link>
          <p className="mt-2 text-sm text-gray-500">Professional Startup Valuations</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          {content}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 transition-colors hover:text-primary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
