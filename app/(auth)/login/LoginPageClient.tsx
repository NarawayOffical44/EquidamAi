"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, Mail, Lock, MailCheck, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "../AuthShell";

const iconClassName = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500";

function getSafeNextPath(value: string | null) {
  const nextPath = value?.trim() || "";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.includes("\\")) return "";
  if (nextPath.startsWith("/api/")) return "";
  return nextPath;
}

function buildAuthHref(path: "/login" | "/signup", nextPath: string, email: string) {
  const params = new URLSearchParams();
  if (nextPath) params.set("next", nextPath);
  if (email.trim()) params.set("email", email.trim().toLowerCase());
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function friendlyAuthError(message?: string) {
  if (!message) return "Could not sign in. Please try again.";
  if (/invalid login|credentials/i.test(message)) return "Email or password is incorrect.";
  if (/configured|environment|supabase|database|schema|metadata/i.test(message)) return "Could not sign in. Refresh this page and try again.";
  return message;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailNotConfirmed(false);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        if (authError.message.toLowerCase().includes("email not confirmed")) {
          setEmailNotConfirmed(true);
        } else {
          setError(friendlyAuthError(authError.message));
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Login failed");
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", authData.user.id)
        .single();

      if (nextPath) {
        router.push(nextPath);
        return;
      }

      const { data: startupAccess } = await supabase
        .from("startup_card_access")
        .select("startup_id")
        .eq("user_id", authData.user.id)
        .eq("status", "accepted")
        .maybeSingle();

      if (startupAccess?.startup_id) {
        router.push(`/startup/${startupAccess.startup_id}?tab=profile`);
        return;
      }

      router.push(userData?.onboarding_completed ? "/dashboard" : "/onboarding");
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResendLoading(false);
    if (!error) setResendSent(true);
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setResetLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetLoading(false);

    if (error) {
      setError(friendlyAuthError(error.message));
    } else {
      setResetSent(true);
    }
  };

  if (emailNotConfirmed) {
    return (
      <AuthShell
        eyebrow="Email verification"
        title="Confirm your email first"
        description="Open the confirmation link we sent before signing in to your Evaldam workspace."
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-primary">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm leading-6 text-gray-600">
            We sent a confirmation link to <span className="font-semibold text-gray-950">{email}</span>. Click it to activate your account, then sign in.
          </p>

          {resendSent ? (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              Confirmation email resent.
            </p>
          ) : (
            <button type="button" onClick={handleResend} disabled={resendLoading} className="btn btn-secondary mt-5 h-10 w-full gap-2">
              {resendLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Resend confirmation email
            </button>
          )}

          <button type="button" onClick={() => setEmailNotConfirmed(false)} className="mt-4 text-sm font-semibold text-gray-500 transition-colors hover:text-primary">
            Try a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Workspace access"
      title="Sign in to Evaldam"
      description="Open your valuation workspace, saved reports, assumptions, and Startup AI conversations."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="form-label">
            Email address
          </label>
          <div className="relative">
            <Mail className={iconClassName} aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input h-10 !pl-12"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="form-label mb-0">
              Password
            </label>
            <button type="button" onClick={handlePasswordReset} disabled={resetLoading} className="text-xs font-semibold text-primary hover:underline disabled:opacity-50">
              {resetLoading ? "Sending..." : "Forgot password?"}
            </button>
          </div>
          <div className="relative">
            <Lock className={iconClassName} aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input h-10 !pl-12 !pr-11"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 transition-colors hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {resetSent ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            Password reset email sent.
          </div>
        ) : null}

        <button type="submit" disabled={loading} className="btn btn-primary h-10 w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 border-t border-gray-100 pt-3 text-center">
        <p className="text-sm text-gray-500">Don&apos;t have an account?</p>
        <Link href={buildAuthHref("/signup", nextPath, email)} className="btn btn-secondary mt-2 h-10 w-full">
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}
