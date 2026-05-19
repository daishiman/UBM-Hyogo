import { ImageResponse } from "next/og";

export const alt = "UBM 兵庫支部会";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>
          UBM 兵庫支部会
        </div>
        <div style={{ marginTop: 24, fontSize: 32, opacity: 0.9 }}>
          Hyogo Branch Members
        </div>
      </div>
    ),
    { ...size },
  );
}
