"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function NewStartupPage() {
  const [step, setStep] = useState<"create" | "done">("create");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [createdStartupId, setCreatedStartupId] = useState<string>("");
  const [companyName, setCompanyName] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      else setUser(user);
    };
    checkUser();
  }, [router, supabase]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return alert("Enter company name");

    setLoading(true);
    try {
      const response = await fetch("/api/startup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          stage: "seed",
          description: "",
          website_url: "",
          arr: 0,
          monthly_growth_rate: 0,
          industry: "",
          team_size: 0,
          founding_year: new Date().getFullYear(),
          problem: "",
          solution: "",
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setCreatedStartupId(result.data.id);
      setStep("done");
    } catch (error) {
      alert("Error: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {step === "create" && (
          <>
            <div className="mb-4 inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              Step 1 of 2
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-3">Add New Startup</h1>
            <p className="text-neutral-600 mb-8">Just enter your company name to get started</p>

            <form onSubmit={handleCreate} className="space-y-6">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                className="w-full px-4 py-3 text-lg border-2 border-neutral-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                autoFocus
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !companyName.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6 text-sm font-semibold">
              ✅ Startup Created
            </div>
            <h2 className="text-2xl font-bold mb-2">{companyName}</h2>
            <p className="text-neutral-600 mb-8">Your startup is ready. Click below to view it.</p>
            <button
              onClick={() => router.push(`/app/startup/${createdStartupId}/report`)}
              className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600"
            >
              Go to Startup Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
