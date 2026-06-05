import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Evaldam AI free startup valuation calculator preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const primary = "#007a7a";
const primaryLight = "#e5f6f6";
const ink = "#111827";
const muted = "#64748b";

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
            justifyContent: "space-between",
            gap: 42,
            border: "2px solid #d7eeee",
            borderRadius: 28,
            background: "white",
            padding: 48,
          }}
        >
          <div style={{ width: 560, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
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

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 64, lineHeight: 1.02, fontWeight: 900, color: ink }}>
                Free startup
              </div>
              <div style={{ fontSize: 64, lineHeight: 1.02, fontWeight: 900, color: primary }}>
                valuation range
              </div>
              <div style={{ marginTop: 26, fontSize: 27, lineHeight: 1.35, color: muted }}>
                Use public website signals to get a directional low, mid, and high range before building the full report.
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, fontSize: 21, fontWeight: 800, color: ink }}>
              <span>Website signals</span>
              <span style={{ color: primary }}>{"->"}</span>
              <span>Range in minutes</span>
            </div>
          </div>

          <div
            style={{
              width: 430,
              height: "100%",
              borderRadius: 24,
              background: "#f8fafc",
              border: "1px solid #dbe7e7",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 900, color: ink }}>Calculator preview</div>
            {["Website URL", "Email", "Phone"].map((label) => (
              <div
                key={label}
                style={{
                  height: 52,
                  borderRadius: 12,
                  background: "white",
                  border: "1px solid #d8e4e4",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 18px",
                  color: muted,
                  fontSize: 19,
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            ))}
            <div
              style={{
                height: 58,
                borderRadius: 14,
                background: primary,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 21,
                fontWeight: 900,
              }}
            >
              Generate my valuation range
            </div>
            <div
              style={{
                marginTop: "auto",
                borderRadius: 18,
                background: primaryLight,
                border: "1px solid #bfe7e7",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: primary }}>Directional range</div>
              <div style={{ display: "flex", gap: 12 }}>
                {["Low", "Mid", "High"].map((label, index) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      background: "white",
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 800, color: muted }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: ink }}>{["$8.3M", "$13.6M", "$18.9M"][index]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
