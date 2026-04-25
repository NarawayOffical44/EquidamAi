"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, ArrowRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function NewStartupPage() {
  const [file, setFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<any>(null);
  const [step, setStep] = useState<"upload" | "review" | "valuate">("upload");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
    };

    checkUser();
  }, [router, supabase]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !websiteUrl) {
      alert("Please upload a PDF or enter a website URL");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (websiteUrl) formData.append("websiteUrl", websiteUrl);

      const response = await fetch("/api/extract-profile", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setExtractedProfile(result.data.autoExtracted);
        setStep("review");
      } else {
        alert("Extraction failed: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const handleValuate = async () => {
    setLoading(true);
    setStep("valuate");
    try {
      if (!user) {
        alert("User not authenticated");
        setStep("review");
        return;
      }

      const p = extractedProfile;

      // Save all extracted fields — direct DB columns + everything else in profile_data JSONB
      const { data: startupData, error: startupError } = await supabase
        .from("startups")
        .insert({
          user_id: user.id,
          company_name: p.companyName || companyName || "Untitled",
          stage: p.stage || "seed",
          industry: p.industry || null,
          description: p.description || null,
          website_url: p.websiteUrl || websiteUrl || null,
          arr: p.annualRecurringRevenue || p.monthlyRecurringRevenue ? (p.monthlyRecurringRevenue || 0) * 12 : 0,
          monthly_growth_rate: p.monthlyGrowthRate || 0,
          team_size: p.teamSize || p.team?.length || null,
          profile_data: {
            tagline: p.tagline || null,
            founded: p.founded || null,
            headquarters: p.headquarters || null,
            location: p.location || p.headquarters || null,
            team: p.team || [],
            monthly_recurring_revenue: p.monthlyRecurringRevenue || null,
            burn_rate: p.burnRate || null,
            runway_months: p.runwayMonths || null,
            sam: p.serviceableAddressableMarket || null,
            som: p.serviceableObtainableMarket || null,
            revenue_model: p.revenueModel || null,
            customer_count: p.customerCount || null,
            funding_raised: p.fundingRaised || null,
            last_round: p.lastRound || null,
            accelerators: p.accelerators || [],
            competitive_moat: p.competitiveMoat || null,
            founder_exits: p.founderExits || null,
            has_patent: p.hasPatent || false,
            patent_details: p.patentDetails || null,
            key_investors: p.keyInvestors || null,
            linkedin_url: p.linkedinUrl || null,
          },
        })
        .select()
        .single();

      if (startupError) {
        console.error("Error saving startup:", startupError);
        alert("Failed to save startup");
        setStep("review");
        return;
      }

      const startupId = startupData.id;

      // Then run valuation
      const fullProfile = {
        id: startupId,
        ...p,
        companyName: p.companyName || companyName,
        websiteUrl: p.websiteUrl || websiteUrl,
        ...(startupData.profile_data || {}),
      };

      const response = await fetch("/api/valuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupProfile: fullProfile,
          userId: user.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const valuation = result.data.valuation;
        // Save valuation to database
        await supabase.from("valuations").insert({
          startup_id: startupId,
          user_id: user.id,
          blended_low_range: valuation.blended?.lowRange,
          blended_high_range: valuation.blended?.highRange,
          blended_weighted_average: valuation.blended?.weightedAverage,
          confidence_level: valuation.confidenceLevel || "high",
          data_completeness: valuation.dataCompleteness || 80,
          methods_results: valuation.methods,
          key_reasons: valuation.blended?.keyReasons,
          report_data: {
            reportMarkdown: result.data.reportMarkdown,
            executiveSummary: valuation.executiveSummary,
            detailedAnalysis: valuation.detailedAnalysis,
            sensitivityAnalysis: valuation.sensitivityAnalysis,
            professionalCitation: valuation.professionalCitation,
            methodBreakdown: valuation.blended?.methodBreakdown,
            generatedAt: valuation.generatedAt,
            generatedByModel: valuation.generatedByModel,
            startupProfile: fullProfile,
          },
        });

        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        alert("Valuation failed: " + (result.error?.message || result.error));
        setStep("review");
      }
    } catch (error) {
      console.error(error);
      alert("Error during valuation");
      setStep("review");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-sm px-container py-content">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === "upload" ? "bg-primary text-white" : "bg-neutral-200 text-neutral-700"}`}>
                1
              </div>
              <span className={step === "upload" ? "text-neutral-900 font-semibold" : "text-neutral-600"}>Upload</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step !== "upload" ? "bg-primary" : "bg-neutral-200"}`} />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === "review" || step === "valuate" ? "bg-primary text-white" : "bg-neutral-200 text-neutral-700"}`}>
                2
              </div>
              <span className={step !== "upload" ? "text-neutral-900 font-semibold" : "text-neutral-600"}>Review</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step === "valuate" ? "bg-primary" : "bg-neutral-200"}`} />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === "valuate" ? "bg-primary text-white" : "bg-neutral-200 text-neutral-700"}`}>
                3
              </div>
              <span className={step === "valuate" ? "text-neutral-900 font-semibold" : "text-neutral-600"}>Valuate</span>
            </div>
          </div>
        </div>

        {step === "upload" && (
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-8">Create Valuation Profile</h1>
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center bg-neutral-50">
                <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-6" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Upload Pitch Deck</h3>
                <p className="text-neutral-600 mb-8">PDF, website URL, or description. Claude will extract company info automatically.</p>

                <div className="space-y-6">
                  <div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                    {file && <p className="text-sm text-primary mt-2">{file.name}</p>}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-neutral-50 text-neutral-600">or</span>
                    </div>
                  </div>

                  <div>
                    <input
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg mt-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting Profile...
                    </>
                  ) : (
                    <>
                      Extract Profile
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-900">Review Startup Profile</h1>

            <div className="card">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Company Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label required">Company Name</label>
                  <input
                    type="text"
                    value={companyName || extractedProfile?.companyName || ""}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (extractedProfile) {
                        setExtractedProfile({
                          ...extractedProfile,
                          companyName: e.target.value,
                        });
                      }
                    }}
                    placeholder="Enter company name"
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Stage</label>
                  <select
                    value={extractedProfile.stage || "seed"}
                    onChange={(e) =>
                      setExtractedProfile({
                        ...extractedProfile,
                        stage: e.target.value,
                      })
                    }
                    className="input"
                  >
                    <option value="pre-revenue">Pre-Revenue</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b+">Series B+</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Recurring Revenue (ARR)</label>
                  <input
                    type="number"
                    value={extractedProfile.annualRecurringRevenue || 0}
                    onChange={(e) =>
                      setExtractedProfile({
                        ...extractedProfile,
                        annualRecurringRevenue: parseInt(e.target.value),
                      })
                    }
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Growth Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={extractedProfile.monthlyGrowthRate || 0}
                    onChange={(e) =>
                      setExtractedProfile({
                        ...extractedProfile,
                        monthlyGrowthRate: parseFloat(e.target.value),
                      })
                    }
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("upload")}
                className="btn btn-secondary"
              >
                Back to Upload
              </button>
              <button
                onClick={handleValuate}
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Valuation...
                  </>
                ) : (
                  <>
                    Generate Valuation
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === "valuate" && (
          <div className="card text-center py-16">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-primary" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Generating Valuation...</h2>
            <p className="text-neutral-600 text-lg">
              Running all 5 professional valuation methods and analyzing market data. This typically takes 30-60 seconds.
            </p>
            <div className="mt-8 space-y-2 text-sm text-neutral-600">
              <div>• Scorecard Method (Payne)</div>
              <div>• Berkus Checklist</div>
              <div>• Venture Capital Method</div>
              <div>• DCF with Long-Term Growth</div>
              <div>• DCF with Exit Multiples</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
