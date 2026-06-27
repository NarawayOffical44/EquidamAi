import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Evaldam AI startup valuation and fundraising blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const primary = "#007a7a";
const ink = "#111827";
const muted = "#64748b";

const topics = [
  "Pre-money vs post-money valuation",
  "SAFE valuation caps explained",
  "Berkus method for early-stage startups",
  "VC method: how investors model returns",
  "Startup valuation benchmarks by country",
  "Cap table dilution for founders",
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6fbfb",
          padding: 54,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            border: "2px solid #d7eeee",
            borderRadius: 28,
            background: "white",
            padding: 46,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: primary,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  fontWeight: 900,
                }}
              >
                +
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, color: ink }}>Evaldam AI</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: primary }}>equidamai.com/blog</div>
          </div>

          <div style={{ marginTop: 36, display: "flex", justifyContent: "space-between", gap: 40 }}>
            <div style={{ width: 430, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 58, lineHeight: 1.05, fontWeight: 900, color: ink }}>
                Startup
              </div>
              <div style={{ fontSize: 58, lineHeight: 1.05, fontWeight: 900, color: primary }}>
                valuation
              </div>
              <div style={{ fontSize: 58, lineHeight: 1.05, fontWeight: 900, color: ink }}>
                guides
              </div>
              <div style={{ marginTop: 20, fontSize: 24, lineHeight: 1.4, color: muted }}>
                Founder-friendly guides on valuation, fundraising, dilution, and investor-ready reports.
              </div>
            </div>

            <div style={{ width: 550, display: "flex", flexDirection: "column", gap: 10 }}>
              {topics.map((topic) => (
                <div
                  key={topic}
                  style={{
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid #dbe7e7",
                    padding: "14px 20px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: ink,
                  }}
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
