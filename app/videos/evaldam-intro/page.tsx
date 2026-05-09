import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Play } from "lucide-react";

export const metadata: Metadata = {
  title: "Evaldam AI Demo Video | How Startup Valuation Works",
  description: "Watch how Evaldam AI generates professional startup valuations in 60 seconds using 6 industry-standard methods. See the platform in action.",
  keywords: "startup valuation demo, AI valuation video, how evaldam works, startup valuation tutorial",
  openGraph: {
    title: "Evaldam AI Demo - Professional Startup Valuations",
    description: "Watch how AI-powered valuation works in 60 seconds",
    url: "https://equidamai.com/videos/evaldam-intro",
    type: "video.other",
    images: [{
      url: "https://equidamai.com/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Evaldam AI Demo",
    }],
    videos: [{
      url: "https://equidamai.com/videos/evaldam-intro.mp4",
      secureUrl: "https://equidamai.com/videos/evaldam-intro.mp4",
      type: "video/mp4",
      width: 1920,
      height: 1080,
    }],
  },
  twitter: {
    card: "player",
    title: "Evaldam AI Demo - Professional Startup Valuations",
    description: "Watch how AI generates credible startup valuations",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

export default function VideoPage() {
  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Evaldam AI - Professional Startup Valuations",
    "description": "Introduction to Evaldam AI platform for startup valuation using 6 professional methods. Learn how the platform works and get your valuation in 60 seconds.",
    "thumbnailUrl": ["https://equidamai.com/opengraph-image"],
    "uploadDate": "2026-04-30",
    "duration": "PT1M30S",
    "contentUrl": "https://equidamai.com/videos/evaldam-intro.mp4",
    "embedUrl": "https://equidamai.com/videos/evaldam-intro",
    "interactionCount": "127",
    "publication": {
      "@type": "BroadcastEvent",
      "isLiveNow": false
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-6 py-16">
          {/* Video Section */}
          <div className="mb-12">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video">
              <video
                className="w-full h-full"
                poster="https://equidamai.com/logo.png"
                controls
                controlsList="nodownload"
              >
                <source src="/videos/evaldam-intro.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-black text-gray-900 mb-4">
                Evaldam AI - Professional Startup Valuations
              </h1>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Published:</span>
                  <span className="text-sm text-gray-500">April 30, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Duration:</span>
                  <span className="text-sm text-gray-500">1 minute 30 seconds</span>
                </div>
              </div>

              <div className="prose prose-sm max-w-none mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
                <p className="text-gray-600 mb-4">
                  In this demo, we show you exactly how Evaldam AI generates professional startup valuations using 6 industry-standard methods:
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">1</span>
                    <div>
                      <strong>Scorecard Method</strong>
                      <p className="text-sm text-gray-600">Bill Payne's framework with weighted factors</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">2</span>
                    <div>
                      <strong>Berkus Method</strong>
                      <p className="text-sm text-gray-600">Dave Berkus's qualitative assessment</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">3</span>
                    <div>
                      <strong>VC Method</strong>
                      <p className="text-sm text-gray-600">Venture capital investment calculation</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">4</span>
                    <div>
                      <strong>DCF Long-Term Growth</strong>
                      <p className="text-sm text-gray-600">Discounted cash flow with growth projections</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">5</span>
                    <div>
                      <strong>DCF Exit Multiples</strong>
                      <p className="text-sm text-gray-600">Valuation based on exit scenarios</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">6</span>
                    <div>
                      <strong>Evaldam AI Score</strong>
                      <p className="text-sm text-gray-600">Proprietary AI-driven methodology</p>
                    </div>
                  </li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">What You Get</h2>
                <p className="text-gray-600 mb-4">
                  Each valuation report includes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
                  <li>Blended valuation range (low, mid, high estimates)</li>
                  <li>6-method breakdown with detailed reasoning</li>
                  <li>Market comparables analysis</li>
                  <li>Sensitivity analysis</li>
                  <li>Executive summary</li>
                  <li>Professional PDF report ready to share with investors</li>
                </ul>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8">
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Ready to get your startup valued?</strong>
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/free-valuation">
                    <button className="px-6 py-3 bg-primary hover:opacity-90 text-white text-sm font-bold rounded-lg transition-opacity">
                      Try Free Valuation
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button className="px-6 py-3 border-2 border-primary text-primary hover:bg-primary/5 text-sm font-bold rounded-lg transition-colors">
                      Create Account
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside>
              <div className="sticky top-24 space-y-6">
                {/* Platform Overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">About Evaldam</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Professional AI-powered startup valuation for Indian founders raising angel and seed rounds.
                  </p>
                  <Link href="/">
                    <button className="w-full py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                      Learn More →
                    </button>
                  </Link>
                </div>

                {/* Featured Stats */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-black text-primary">140K+</div>
                      <div className="text-xs font-semibold text-gray-600">Startups Valued</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-primary">94%</div>
                      <div className="text-xs font-semibold text-gray-600">Positive Investor Reactions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-primary">6</div>
                      <div className="text-xs font-semibold text-gray-600">Valuation Methods</div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
            </div>
        </main>

        {/* Footer CTA */}
        <section className="mt-20 py-16 bg-gradient-to-br from-gray-50 to-white border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Ready to value your startup?
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Get a professional, investor-ready valuation in 60 seconds. No signup required to try our free valuation checker.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/free-valuation">
                <button className="px-8 py-3 bg-primary hover:opacity-90 text-white font-bold rounded-lg transition-opacity">
                  Try Free Valuation
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-8 py-3 border-2 border-gray-300 text-gray-900 hover:border-gray-400 font-bold rounded-lg transition-colors">
                  Sign Up Now
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
