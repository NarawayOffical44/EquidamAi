"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trackSignup } from "@/lib/analytics/ga4";
import { getLeadAttribution } from "@/lib/leads/client-attribution";
import { FormError } from "@/components/FormError";
import { AuthShell } from "../AuthShell";

type SignupFieldErrors = Partial<Record<"email" | "password" | "confirmPassword", string>>;

const iconClassName = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500";

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
  const country = searchParams.get("country");
  if (country) params.set("country", country);

  return `/checkout?${params.toString()}`;
}

function buildAuthHref(path: "/login" | "/signup", nextPath: string, email: string) {
  const params = new URLSearchParams();
  if (nextPath) params.set("next", nextPath);
  if (email.trim()) params.set("email", email.trim().toLowerCase());
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function friendlyAuthError(message?: string) {
  if (!message) return "Could not complete signup. Please try again.";
  if (/invalid login|credentials/i.test(message)) return "Email or password is incorrect.";
  if (/already|registered|exists/i.test(message)) return "An account already exists for this email. Sign in with this email to continue.";
  if (/configured|environment|supabase|database|schema|metadata/i.test(message)) return "Could not complete signup. Refresh this page and try again.";
  return message;
}

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const router = useRouter();
  const supabase = createClient();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const authNextPath = nextPath || getCheckoutIntentPath(searchParams);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const signupEmail = email.trim().toLowerCase();
    const validationErrors: SignupFieldErrors = {};

    if (password.length < 8) validationErrors.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) validationErrors.confirmPassword = "Passwords do not match.";

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const planInterest = searchParams.get("plan") || undefined;
      const billingCycle = searchParams.get("billingCycle") || undefined;
      const currency = searchParams.get("currency") || undefined;
      const country = searchParams.get("country") || undefined;
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
          country,
          attribution: getLeadAttribution(),
        }),
      });

      const signupData = await signupResponse.json();
      if (!signupResponse.ok) {
        setError(friendlyAuthError(signupData.error));
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: signupEmail, password });
      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        setLoading(false);
        return;
      }

      trackSignup({ email: signupEmail, plan: planInterest || "startup", source: "other" });
      router.push(authNextPath || "/onboarding");
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="New workspace"
      title="Create your valuation workspace"
      description="Save assumptions, generate investor-ready reports, and keep Startup AI context in one place."
      footer={
        <p className="text-center text-[11px] leading-5 text-gray-500">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="font-semibold text-gray-600 underline-offset-2 hover:text-primary hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-gray-600 underline-offset-2 hover:text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      }
    >
      <form onSubmit={handleSignup} className="space-y-3">
        <div>
          <label htmlFor="signup-full-name" className="form-label">
            Full name
          </label>
          <div className="relative">
            <User className={iconClassName} aria-hidden="true" />
            <input
              id="signup-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input h-10 !pl-12"
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className="form-label">
            Email address
          </label>
          <div className="relative">
            <Mail className={iconClassName} aria-hidden="true" />
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              className={`input h-10 !pl-12 ${fieldErrors.email ? "input-error" : ""}`}
              placeholder="you@company.com"
              aria-describedby={fieldErrors.email ? "work-email-error" : undefined}
              autoComplete="email"
              required
            />
          </div>
          <FormError id="work-email-error" message={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="signup-password" className="form-label">
            Password
          </label>
          <div className="relative">
            <Lock className={iconClassName} aria-hidden="true" />
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              className={`input h-10 !pl-12 !pr-11 ${fieldErrors.password ? "input-error" : ""}`}
              aria-describedby={fieldErrors.password ? "signup-password-error" : undefined}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg-xl p-2 text-gray-500 transition-colors hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <FormError id="signup-password-error" message={fieldErrors.password} />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="form-label">
            Confirm password
          </label>
          <div className="relative">
            <Lock className={iconClassName} aria-hidden="true" />
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
              }}
              className={`input h-10 !pl-12 !pr-11 ${fieldErrors.confirmPassword ? "input-error" : ""}`}
              aria-describedby={fieldErrors.confirmPassword ? "signup-confirm-password-error" : undefined}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg-xl p-2 text-gray-500 transition-colors hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <FormError id="signup-confirm-password-error" message={fieldErrors.confirmPassword} />
        </div>

        <FormError message={error} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm" />

        <button type="submit" disabled={loading} className="btn btn-primary h-10 w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating account...
            </>
          ) : (
            <>
              Create workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 border-t border-gray-100 pt-3 text-center">
        <p className="text-sm text-gray-500">Already have an account?</p>
        <Link href={buildAuthHref("/login", authNextPath, email)} className="btn btn-secondary mt-2 h-10 w-full">
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
