"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, Mail, Lock, MailCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
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

      const { data: userData } = await supabase.from("users").select("plan_active").eq("id", authData.user.id).single();
      router.push(userData?.plan_active ? "/dashboard" : "/pricing?noSub=true");
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Evaldam AI</span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">Professional Startup Valuations</p>
        </div>

        {emailNotConfirmed ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm your email first</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              We sent a confirmation link to <span className="font-medium text-gray-900">{email}</span>.
              Click it to activate your account, then sign in.
            </p>
            {resendSent ? (
              <p className="text-green-600 text-sm font-medium mb-4">Confirmation email resent!</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="btn btn-secondary w-full flex items-center justify-center gap-2 mb-4"
              >
                {resendLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Resend Confirmation Email
              </button>
            )}
            <button onClick={() => setEmailNotConfirmed(false)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Try a different email
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign in</h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="form-label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label mb-0">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
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
                <span className="px-3 bg-white text-xs text-gray-400">or</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Don&apos;t have an account?</p>
              <Link href="/signup">
                <button className="btn btn-secondary w-full">Create Account</button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
