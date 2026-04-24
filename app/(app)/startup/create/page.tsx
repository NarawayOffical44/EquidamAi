"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Link2, Type, Loader2, ArrowRight, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Section = "upload" | "company" | "metrics" | "team" | "market";

interface StartupData {
  companyName: string;
  description: string;
  website: string;
  stage: string;
  arr: number;
  monthlyGrowth: number;
  teamSize: number;
  foundingYear: number;
  industry: string;
  problem: string;
  solution: string;
}

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "upload", label: "Upload Details", icon: "📤" },
  { id: "company", label: "Company Info", icon: "🏢" },
  { id: "metrics", label: "Metrics", icon: "📊" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "market", label: "Market", icon: "🎯" },
];

export default function CreateStartupPage() {
  const [currentSection, setCurrentSection] = useState<Section>("upload");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<StartupData>({
    companyName: "",
    description: "",
    website: "",
    stage: "seed",
    arr: 0,
    monthlyGrowth: 0,
    teamSize: 1,
    foundingYear: new Date().getFullYear(),
    industry: "",
    problem: "",
    solution: "",
  });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
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

  const handleExtractFromPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const input = (document.getElementById("pitchInput") as HTMLTextAreaElement)
        ?.value || "";
      const file = (document.getElementById("pitchFile") as HTMLInputElement)
        ?.files?.[0];

      if (!input && !file) {
        alert("Please upload a file or paste pitch deck text");
        return;
      }

      const formData = new FormData();
      if (file) formData.append("file", file);
      if (input) formData.append("text", input);

      const response = await fetch("/api/extract-profile", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setData((prev) => ({
          ...prev,
          companyName: result.data.autoExtracted.companyName || prev.companyName,
          description:
            result.data.autoExtracted.description || prev.description,
          website: result.data.autoExtracted.website || prev.website,
          stage: result.data.autoExtracted.stage || prev.stage,
          arr:
            result.data.autoExtracted.annualRecurringRevenue || prev.arr,
          monthlyGrowth:
            result.data.autoExtracted.monthlyGrowthRate || prev.monthlyGrowth,
          industry: result.data.autoExtracted.industry || prev.industry,
        }));
        setCurrentSection("company");
        alert("Profile extracted! Review and edit details.");
      } else {
        alert("Extraction failed: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error extracting profile");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateValuation = async () => {
    if (!data.companyName) {
      alert("Please enter company name");
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        alert("User not authenticated");
        return;
      }

      // Save startup to database
      const { data: startupData, error: startupError } = await supabase
        .from("startups")
        .insert({
          user_id: user.id,
          company_name: data.companyName,
          stage: data.stage,
          website_url: data.website,
          arr: data.arr,
          monthly_growth_rate: data.monthlyGrowth,
        })
        .select()
        .single();

      if (startupError) throw startupError;

      // Run valuation
      const response = await fetch("/api/valuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupProfile: {
            id: startupData.id,
            companyName: data.companyName,
            stage: data.stage,
            description: data.description,
            website: data.website,
            annualRecurringRevenue: data.arr,
            monthlyGrowthRate: data.monthlyGrowth,
            teamSize: data.teamSize,
            industry: data.industry,
            problem: data.problem,
            solution: data.solution,
          },
          userId: user.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const valuation = result.data.valuation;
        // Save valuation
        await supabase.from("valuations").insert({
          startup_id: startupData.id,
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
          },
        });

        router.push("/dashboard");
      } else {
        alert("Valuation failed: " + (result.error?.message || result.error));
      }
    } catch (error) {
      console.error(error);
      alert("Error: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg border border-neutral-200"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:relative w-64 bg-white border-r border-neutral-200 p-6 transition-transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ height: "calc(100vh - 70px)" }}
      >
        <h2 className="text-lg font-bold text-neutral-900 mb-6">
          Add Your Startup
        </h2>

        <nav className="space-y-2">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setCurrentSection(section.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                currentSection === section.id
                  ? "bg-primary text-white font-medium"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        {/* Sidebar CTA */}
        <button
          onClick={handleGenerateValuation}
          disabled={loading || !data.companyName}
          className="w-full mt-8 btn btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Valuating...
            </>
          ) : (
            <>
              Generate Valuation
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 md:p-12">
        <div className="max-w-3xl">
          {/* Upload Section */}
          {currentSection === "upload" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Upload Your Pitch Deck
                </h1>
                <p className="text-neutral-600">
                  We'll auto-fill key details from your pitch deck
                </p>
              </div>

              <form onSubmit={handleExtractFromPitch} className="space-y-6">
                {/* File Upload */}
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <label htmlFor="pitchFile" className="block mb-2">
                    <span className="text-sm font-medium text-neutral-900 cursor-pointer">
                      Upload Pitch Deck (PDF)
                    </span>
                  </label>
                  <input
                    id="pitchFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <p className="text-xs text-neutral-500">
                    PDF, Word, or Google Docs
                  </p>
                </div>

                {/* Or Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-neutral-50 text-neutral-600">
                      OR
                    </span>
                  </div>
                </div>

                {/* Website Link */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Your Website
                  </label>
                  <div className="flex gap-2">
                    <Link2 className="w-5 h-5 text-neutral-500 mt-3" />
                    <input
                      type="url"
                      placeholder="https://yourcompany.com"
                      className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Text Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Or Paste Your Pitch
                  </label>
                  <textarea
                    id="pitchInput"
                    placeholder="Paste your pitch deck text, LinkedIn profile, or company description..."
                    rows={6}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Type className="w-4 h-4" />
                      Extract & Auto-Fill Details
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Company Info Section */}
          {currentSection === "company" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Company Information
                </h1>
                <p className="text-neutral-600">Edit and verify company details</p>
              </div>

              <div className="space-y-6 bg-white p-6 rounded-lg border border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={(e) =>
                      setData({ ...data, companyName: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Your Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Stage
                  </label>
                  <select
                    value={data.stage}
                    onChange={(e) =>
                      setData({ ...data, stage: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="pre-revenue">Pre-Revenue</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b+">Series B+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) =>
                      setData({ ...data, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                    placeholder="What does your company do?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={data.website}
                    onChange={(e) =>
                      setData({ ...data, website: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={data.industry}
                    onChange={(e) =>
                      setData({ ...data, industry: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="e.g., SaaS, FinTech, AI"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Metrics Section */}
          {currentSection === "metrics" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Financial Metrics
                </h1>
                <p className="text-neutral-600">
                  {data.stage === "pre-revenue"
                    ? "No revenue yet — that's fine. We'll use qualitative methods like Scorecard & Berkus that are built for pre-revenue startups."
                    : "Enter your key financial metrics"}
                </p>
              </div>

              {data.stage === "pre-revenue" && (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="font-semibold mb-1">Pre-Revenue Valuation Methods Used:</p>
                    <ul className="space-y-0.5 text-blue-700">
                      <li>• <strong>Scorecard Method</strong> — team, market, product, competition</li>
                      <li>• <strong>Berkus Checklist</strong> — milestone-based (idea → prototype → MVP → sales)</li>
                      <li>• <strong>VC Method</strong> — based on projected exit value & investor return</li>
                      <li>• <strong>Evaldam Score</strong> — proprietary: industry growth, moat, timing</li>
                    </ul>
                    <p className="mt-2 text-blue-600">Fill in TAM and team details for a more accurate result.</p>
                  </div>
                </div>
              )}

              <div className="space-y-6 bg-white p-6 rounded-lg border border-neutral-200">
                {data.stage !== "pre-revenue" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Annual Recurring Revenue (ARR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                      <input
                        type="number"
                        value={data.arr}
                        onChange={(e) =>
                          setData({ ...data, arr: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {data.stage !== "pre-revenue" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Monthly Growth Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={data.monthlyGrowth}
                      onChange={(e) =>
                        setData({
                          ...data,
                          monthlyGrowth: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="e.g. 10 for 10% MoM"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Total Addressable Market (TAM) — USD
                    <span className="ml-1 text-xs text-neutral-500 font-normal">Important for pre-revenue</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                    <input
                      type="number"
                      value={(data as any).tam || ""}
                      onChange={(e) =>
                        setData({ ...data, ...{ tam: parseFloat(e.target.value) || 0 } } as any)
                      }
                      className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="e.g. 5000000000 for $5B"
                    />
                  </div>
                </div>

                {data.stage === "pre-revenue" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Funding Raised So Far — USD
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                      <input
                        type="number"
                        value={(data as any).fundingRaised || ""}
                        onChange={(e) =>
                          setData({ ...data, ...{ fundingRaised: parseFloat(e.target.value) || 0 } } as any)
                        }
                        className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="0 if bootstrapped"
                      />
                    </div>
                  </div>
                )}

                {data.stage === "pre-revenue" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Key Milestones Achieved
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: "hasPrototype", label: "Working prototype / MVP built" },
                        { key: "hasPilotCustomers", label: "Pilot customers / LOIs signed" },
                        { key: "hasPatent", label: "Patent filed or granted" },
                        { key: "hasAccelerator", label: "Accepted into accelerator (YC, Techstars, etc.)" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-neutral-200 hover:border-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={(data as any)[key] || false}
                            onChange={(e) => setData({ ...data, ...{ [key]: e.target.checked } } as any)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm text-neutral-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Section */}
          {currentSection === "team" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Team Information
                </h1>
                <p className="text-neutral-600">Tell us about your team</p>
              </div>

              <div className="space-y-6 bg-white p-6 rounded-lg border border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Team Size
                  </label>
                  <input
                    type="number"
                    value={data.teamSize}
                    onChange={(e) =>
                      setData({ ...data, teamSize: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={data.foundingYear}
                    onChange={(e) =>
                      setData({
                        ...data,
                        foundingYear: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Market Section */}
          {currentSection === "market" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Market Information
                </h1>
                <p className="text-neutral-600">
                  Describe your market opportunity
                </p>
              </div>

              <div className="space-y-6 bg-white p-6 rounded-lg border border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Problem You Solve
                  </label>
                  <textarea
                    value={data.problem}
                    onChange={(e) =>
                      setData({ ...data, problem: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                    placeholder="What problem does your solution address?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Your Solution
                  </label>
                  <textarea
                    value={data.solution}
                    onChange={(e) =>
                      setData({ ...data, solution: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                    placeholder="How do you solve this problem?"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
