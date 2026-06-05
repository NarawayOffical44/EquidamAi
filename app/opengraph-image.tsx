import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Evaldam AI startup valuation software";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f7fbfb",
          padding: 58,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "space-between",
            border: "2px solid #d8eeee",
            borderRadius: 28,
            background: "white",
            padding: 52,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  background: "#007a7a",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 38,
                  fontWeight: 900,
                }}
              >
                +
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#111827" }}>Evaldam AI</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 66, lineHeight: 1.02, fontWeight: 900, color: "#111827" }}>
                Defensible startup
              </div>
              <div style={{ fontSize: 66, lineHeight: 1.02, fontWeight: 900, color: "#00a0a0" }}>
                valuations
              </div>
              <div style={{ marginTop: 28, maxWidth: 690, fontSize: 28, lineHeight: 1.35, color: "#4b5563" }}>
                Six methods, assumptions trail, comparables, and investor-ready reports.
              </div>
            </div>

            <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>equidamai.com</div>
          </div>

          <div
            style={{
              width: 300,
              height: 260,
              marginTop: 88,
              borderRadius: 18,
              background: "#f0fafa",
              border: "1px solid #bce8e8",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div style={{ width: 236, height: 28, borderRadius: 8, background: "#007a7a" }} />
            <div style={{ width: 174, height: 18, borderRadius: 6, background: "#9bdada" }} />
            <div style={{ width: 216, height: 18, borderRadius: 6, background: "#cfeeee" }} />
            <div style={{ width: 132, height: 18, borderRadius: 6, background: "#9bdada" }} />
            <div style={{ marginTop: "auto", fontSize: 34, fontWeight: 900, color: "#111827" }}>$2.4M</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
