import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Evaldam AI GitHub repo startup valuation calculator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const primary = "#007a7a";
const ink = "#111827";
const muted = "#64748b";

const signals = [
  { label: "Execution Signal", desc: "Code maturity, docs, tests, releases" },
  { label: "Market Pull", desc: "Stars, forks, contributors, adoption" },
  { label: "Idea-Stage Valuation", desc: "Berkus & Scorecard for pre-revenue" },
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
            <div style={{ fontSize: 20, fontWeight: 900, color: primary }}>equidamai.com/github-valuation</div>
          </div>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", gap: 40 }}>
            <div style={{ width: 500, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 18,
                  background: "#f1f5f9",
                  borderRadius: 999,
                  padding: "8px 18px",
                  width: "fit-content",
                  fontSize: 16,
                  fontWeight: 900,
                  color: muted,
                }}
              >
                Free · No signup needed
              </div>
              <div style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 900, color: ink }}>
                Is your GitHub
              </div>
              <div style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 900, color: primary }}>
                project worth
              </div>
              <div style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 900, color: ink }}>
                funding?
              </div>
              <div style={{ marginTop: 22, fontSize: 24, lineHeight: 1.4, color: muted }}>
                Paste a public repo URL. Get an idea-stage startup valuation in under 60 seconds.
              </div>
            </div>

            <div style={{ width: 480, display: "flex", flexDirection: "column", gap: 16 }}>
              {signals.map((s) => (
                <div
                  key={s.label}
                  style={{
                    borderRadius: 18,
                    background: "#f8fafc",
                    border: "1px solid #dbe7e7",
                    padding: "22px 26px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 900, color: ink }}>{s.label}</div>
                  <div style={{ fontSize: 18, color: muted }}>{s.desc}</div>
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
