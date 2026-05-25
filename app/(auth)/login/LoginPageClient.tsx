"use client";


import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowRight, Mail, Lock, MailCheck, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) { setError("Login failed"); setLoading(false); return; }

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
      setError(error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Evaldam AI" width={40} height={40} className="rounded-xl" />
          </Link>
          <p className="text-gray-500 text-sm mt-1">Professional Startup Valuations</p>
        </div>

        {emailNotConfirmed ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm text-center">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm your email first</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              We sent a confirmation link to <span className="font-medium text-gray-900">{email}</span>.
              Click it to activate your account, then sign in.
            </p>
            {resendSent ? (
              <p className="text-green-700 text-sm font-medium mb-4">Confirmation email resent!</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="btn btn-secondary w-full flex items-center justify-center gap-2 mb-4"
              >
                {resendLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Resend Confirmation Email
              </button>
            )}
            <button type="button" onClick={() => setEmailNotConfirmed(false)} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Try a different email
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in</h1>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="form-label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="form-label mb-0">Password</label>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={resetLoading}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {resetLoading ? "Sending..." : "Forgot password?"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              {resetSent && (
                <div className="alert alert-success">
                  <span>Password reset email sent.</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs text-gray-500">or</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Don&apos;t have an account?</p>
              <Link href={buildAuthHref("/signup", nextPath, email)} className="btn btn-secondary w-full">
                Create Account
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
