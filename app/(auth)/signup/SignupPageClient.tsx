"use client";


import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowRight, Mail, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trackSignup } from "@/lib/analytics/ga4";
import { getLeadAttribution } from "@/lib/leads/client-attribution";
import { isWorkEmail, WORK_EMAIL_ERROR } from "@/lib/utils/work-email";

function getSafeNextPath(value: string | null) {
  const nextPath = value?.trim() || "";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.includes("\\")) return "";
  if (nextPath.startsWith("/api/")) return "";
  return nextPath;
}

function getCheckoutIntentPath(searchParams: ReturnType<typeof useSearchParams>) {
  const plan = searchParams.get("plan");
  if (!plan || !["startup", "agency", "founder", "advisor", "pro", "plus"].includes(plan)) {
    return "";
  }

  const params = new URLSearchParams({
    plan,
    billingCycle: searchParams.get("billingCycle") === "monthly" ? "monthly" : "annual",
    currency: searchParams.get("currency") || "USD",
  });

  return `/checkout?${params.toString()}`;
}

function buildAuthHref(path: "/login" | "/signup", nextPath: string, email: string) {
  const params = new URLSearchParams();
  if (nextPath) params.set("next", nextPath);
  if (email.trim()) params.set("email", email.trim().toLowerCase());
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const authNextPath = nextPath || getCheckoutIntentPath(searchParams);
  const emailValue = email.trim();
  const showWorkEmailWarning = emailValue.length > 0 && !isWorkEmail(emailValue);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const signupEmail = email.trim().toLowerCase();

    if (!isWorkEmail(signupEmail)) { setError(WORK_EMAIL_ERROR); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    setLoading(true);

    try {
      const planInterest = searchParams.get("plan") || undefined;
      const billingCycle = searchParams.get("billingCycle") || undefined;
      const currency = searchParams.get("currency") || undefined;
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password,
          full_name: fullName,
          planInterest,
          billingCycle,
          currency,
          attribution: getLeadAttribution(),
        }),
      });

      const signupData = await signupResponse.json();
      if (!signupResponse.ok) { setError(signupData.error || "Signup failed"); setLoading(false); return; }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: signupEmail, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }

      trackSignup({ email: signupEmail, plan: planInterest || "startup", source: "other" });
      router.push(authNextPath || "/onboarding");
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
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

        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Create an account with your work email, then complete a quick setup.</p>
          <div className="alert alert-info mb-5">
            <span className="text-xs font-semibold leading-relaxed">Work email required. Use your company, fund, or agency email.</span>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="signup-full-name" className="form-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="signup-full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-10" autoComplete="name" required />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="form-label">Work email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input pl-10 ${showWorkEmailWarning ? "border-red-300 focus:border-red-500" : ""}`}
                  placeholder="you@company.com"
                  aria-describedby="work-email-help"
                  autoComplete="email"
                  required
                />
              </div>
              <p id="work-email-help" className={`mt-1 text-xs ${showWorkEmailWarning ? "font-semibold text-red-600" : "text-gray-500"}`}>
                {showWorkEmailWarning ? WORK_EMAIL_ERROR : "Personal email domains like Gmail, Yahoo, and Outlook are not accepted."}
              </p>
            </div>

            <div>
              <label htmlFor="signup-password" className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" autoComplete="new-password" required />
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="form-label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="signup-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10" autoComplete="new-password" required />
              </div>
            </div>

            {error && <div className="alert alert-error"><span>{error}</span></div>}

            <button type="submit" disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-gray-400">or</span></div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Already have an account?</p>
            <Link href={buildAuthHref("/login", authNextPath, email)} className="btn btn-secondary w-full">Sign In</Link>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </p>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors">← Back to home</Link>
        </div>
      </div>
    </main>
  );
}
