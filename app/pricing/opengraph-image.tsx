import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Evaldam AI startup valuation pricing plan cards";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const primary = "#007a7a";
const primaryLight = "#e5f6f6";
const ink = "#111827";
const muted = "#64748b";

const plans = [
  { name: "Explore", price: "Free", detail: "Preview range" },
  { name: "Startup", price: "$29", detail: "Full report" },
  { name: "Agency", price: "$120", detail: "Portfolio workflow" },
  { name: "Enterprise", price: "Custom", detail: "API + programs" },
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
            <div style={{ fontSize: 22, fontWeight: 900, color: primary }}>equidamai.com/pricing</div>
          </div>

          <div style={{ marginTop: 38, display: "flex", justifyContent: "space-between", gap: 40 }}>
            <div style={{ width: 470, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 62, lineHeight: 1.03, fontWeight: 900, color: ink }}>
                Startup valuation
              </div>
              <div style={{ fontSize: 62, lineHeight: 1.03, fontWeight: 900, color: primary }}>
                pricing
              </div>
              <div style={{ marginTop: 24, fontSize: 26, lineHeight: 1.35, color: muted }}>
                Free previews, founder reports, advisor workspaces, enterprise programs, and API credits.
              </div>
            </div>

            <div style={{ width: 520, display: "flex", flexWrap: "wrap", gap: 16 }}>
              {plans.map((plan, index) => (
                <div
                  key={plan.name}
                  style={{
                    width: 250,
                    height: 166,
                    borderRadius: 20,
                    background: index === 1 ? primaryLight : "#f8fafc",
                    border: index === 1 ? "2px solid #9edcdc" : "1px solid #dbe7e7",
                    padding: 22,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: ink }}>{plan.name}</div>
                    {index === 1 ? (
                      <div
                        style={{
                          borderRadius: 999,
                          background: primary,
                          color: "white",
                          padding: "6px 10px",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        POPULAR
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 34, fontWeight: 900, color: primary }}>{plan.price}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: muted }}>{plan.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: "auto",
              borderRadius: 18,
              background: "#f8fafc",
              border: "1px solid #dbe7e7",
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              color: ink,
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            <span>Reports</span>
            <span>Startup AI</span>
            <span>Portfolio</span>
            <span>API credits</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
