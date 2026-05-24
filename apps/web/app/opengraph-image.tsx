import { ImageResponse } from "next/og";

export const alt = "UBM 兵庫支部会";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

const OG_BACKGROUND =
  "linear-gradient(135deg, oklch(0.36 0.12 240) 0%, oklch(0.52 0.11 240) 100%)";
const OG_TEXT = "oklch(1 0 0)";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: OG_BACKGROUND,
          color: OG_TEXT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: 0 }}>
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
