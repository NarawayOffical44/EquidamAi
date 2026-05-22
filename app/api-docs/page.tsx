import Link from "next/link";
import { Code2, KeyRound, ShieldCheck, UploadCloud, Wallet } from "lucide-react";
import {
  API_MIN_TOP_UP_USD,
  API_MODEL_PRICING,
  API_RATE_LIMIT_PER_MINUTE,
  getApiUsdPerMillionTokens,
} from "@/lib/developer-api/pricing";

export const metadata = {
  title: "Evaldam API Docs | Model API, API Keys, Credits",
  description:
    "Use the Evaldam model API with self-serve API keys, prepaid credits, usage tracking, and rate limits.",
};

export default function ApiDocsPage() {
  const pricing = API_MODEL_PRICING["evaldam-model"];
  const usdPerMillionTokens = getApiUsdPerMillionTokens();

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex max-w-3xl flex-col gap-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
              <Code2 className="h-3.5 w-3.5" />
              Developer API
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-normal text-gray-950 md:text-5xl">
                Evaldam Model API
              </h1>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Create an account, generate an API key in Settings, add API credits, and call the Evaldam model from your product or workflow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">
                Create account
              </Link>
              <Link href="/login?next=/dashboard" className="btn btn-secondary">
                Open Settings
              </Link>
              <Link href="/pricing#api-credits" className="btn btn-secondary">
                Add API credits
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: KeyRound, title: "API Keys", text: "Generate and revoke keys from Settings after creating an account." },
          { icon: Wallet, title: "Prepaid Credits", text: "API usage is pay-as-you-go and separate from dashboard subscription plans." },
          { icon: ShieldCheck, title: "Rate Limited", text: `${API_RATE_LIMIT_PER_MINUTE} requests per minute per API key to prevent abuse.` },
          { icon: UploadCloud, title: "Bulk Valuations", text: "Enterprise-only CSV batch workflows are available through authenticated API endpoints." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
            <item.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-base font-bold text-gray-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-950">Enterprise bulk valuation workflows</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                Bulk valuation routes are intentionally API-first and gated to Enterprise accounts. Use them for CSV batch uploads and job status tracking after your workspace is enabled.
              </p>
              <div className="mt-4 grid gap-2 text-xs font-semibold text-gray-700 sm:grid-cols-2">
                <code className="rounded-md border border-gray-200 bg-white px-3 py-2">POST /api/bulk-valuations/upload</code>
                <code className="rounded-md border border-gray-200 bg-white px-3 py-2">GET /api/bulk-valuations/[jobId]</code>
              </div>
            </div>
            <Link href="/contact" className="btn btn-secondary shrink-0">
              Enable Bulk Access
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-black text-gray-950">Pricing</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              API usage is billed from a separate prepaid USD wallet. Minimum top-up is ${API_MIN_TOP_UP_USD}.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">{pricing.label}</span>
              <span className="text-sm font-black text-gray-950">
                {usdPerMillionTokens ? `$${usdPerMillionTokens}/1M tokens` : "Token-based"}
              </span>
            </div>
            <div className="px-4 py-3 text-sm text-gray-600">{pricing.description}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            Add credits from Pricing or Settings after signing in. API credits are separate from dashboard subscription plans.
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-gray-950">Request</h2>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-950 p-5 text-sm leading-6 text-gray-100">
{`curl -X POST https://equidamai.com/api/v1/model/chat \\
  -H "Authorization: Bearer evd_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "evaldam-model",
    "messages": [
      { "role": "user", "content": "Explain valuation drivers for a seed SaaS startup." }
    ],
    "max_tokens": 800
  }'`}
          </pre>
          <h2 className="mt-8 text-2xl font-black text-gray-950">Response</h2>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-950 p-5 text-sm leading-6 text-gray-100">
{`{
  "id": "request_id",
  "model": "evaldam-model",
  "content": "Model response...",
  "usage": {
    "cost": "$0.01",
    "tokens": {
      "input": 18,
      "output": 240
    },
    "balance_before": "$25.00",
    "balance_after": "$24.99"
  }
}`}
          </pre>
          <p className="mt-4 text-xs leading-5 text-gray-500">
            API credits expire six months after purchase. Keep API keys server-side and revoke exposed keys from Settings.
          </p>
        </div>
      </section>
    </main>
  );
}
