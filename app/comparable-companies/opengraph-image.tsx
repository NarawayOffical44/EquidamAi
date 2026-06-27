import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Evaldam AI startup comparables and peer benchmarks tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const primary = "#007a7a";
const ink = "#111827";
const muted = "#64748b";

const filters = [
  { label: "Stage", value: "Seed" },
  { label: "Sector", value: "SaaS" },
  { label: "Country", value: "India" },
  { label: "ARR", value: "$50K–$500K" },
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
            <div style={{ fontSize: 20, fontWeight: 900, color: primary }}>equidamai.com/comparable-companies</div>
          </div>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", gap: 40 }}>
            <div style={{ width: 480, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 60, lineHeight: 1.04, fontWeight: 900, color: ink }}>
                Startup
              </div>
              <div style={{ fontSize: 60, lineHeight: 1.04, fontWeight: 900, color: primary }}>
                comparables
              </div>
              <div style={{ fontSize: 60, lineHeight: 1.04, fontWeight: 900, color: ink }}>
                & benchmarks
              </div>
              <div style={{ marginTop: 22, fontSize: 24, lineHeight: 1.4, color: muted }}>
                Find peer companies by stage, sector, ARR, and country to defend your valuation assumptions.
              </div>
            </div>

            <div style={{ width: 500, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: ink, marginBottom: 4 }}>Filter by</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {filters.map((f) => (
                  <div
                    key={f.label}
                    style={{
                      borderRadius: 14,
                      background: "#f8fafc",
                      border: "1px solid #dbe7e7",
                      padding: "14px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      width: "calc(50% - 6px)",
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: muted }}>{f.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: primary }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 8,
                  borderRadius: 18,
                  background: primary,
                  color: "white",
                  padding: "18px 24px",
                  fontSize: 22,
                  fontWeight: 900,
                  textAlign: "center",
                }}
              >
                Search comparables
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
