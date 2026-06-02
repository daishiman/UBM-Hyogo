import type { MemberSummary } from "./member-source";

export const OG_SIZE = { width: 1200, height: 630 } as const;

const BRAND = {
  ink: "#172033",
  muted: "#526070",
  surface: "#f8fafc",
  accent: "#0068a9",
  line: "#c9d6e2",
} as const;

const FONT_FAMILY = "Noto Sans JP";
const STATIC_TEXT = "UBM HyogoMember Directory";

const ONE_BY_ONE_PNG = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0,
  0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120,
  156, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, 167, 141, 129, 132, 0, 0, 0,
  0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function tagLine(summary: MemberSummary): string {
  const parts = [summary.occupation, summary.ubmZone, summary.ubmMembershipType]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return parts.length ? parts.join(" / ") : "UBM Hyogo member";
}

export function buildHtml(title: string, subtitle: string): string {
  return [
    `<div style="display:flex;width:1200px;height:630px;background:${BRAND.surface};font-family:'${FONT_FAMILY}',sans-serif;color:${BRAND.ink};padding:64px;box-sizing:border-box;">`,
    `<div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;border:2px solid ${BRAND.line};border-radius:36px;padding:56px;background:white;">`,
    `<div style="display:flex;align-items:center;gap:18px;font-size:30px;color:${BRAND.accent};font-weight:700;">`,
    `<div style="display:flex;width:18px;height:18px;border-radius:999px;background:${BRAND.accent};"></div>`,
    `<div style="display:flex;">UBM Hyogo</div>`,
    `</div>`,
    `<div style="display:flex;flex-direction:column;gap:28px;">`,
    `<div style="display:flex;font-size:76px;line-height:1.08;font-weight:800;letter-spacing:0;">${escapeHtml(title)}</div>`,
    `<div style="display:flex;font-size:34px;line-height:1.35;color:${BRAND.muted};">${escapeHtml(subtitle)}</div>`,
    `</div>`,
    `<div style="display:flex;font-size:26px;color:${BRAND.muted};">Member Directory</div>`,
    `</div>`,
    `</div>`,
  ].join("");
}

export function renderStaticFallbackOg(): Response {
  return new Response(ONE_BY_ONE_PNG, {
    headers: { "Content-Type": "image/png" },
  });
}

async function imageResponse(title: string, subtitle: string): Promise<Response> {
  if (!("HTMLRewriter" in globalThis)) {
    return renderStaticFallbackOg();
  }
  /* v8 ignore start -- workers-og の ImageResponse/loadGoogleFont は Cloudflare Workers
     ランタイム (HTMLRewriter/Satori) 依存で Node/jsdom テスト環境では実行不能。
     HTML 組成ロジック (buildHtml/tagLine/escapeHtml) は直接 unit test 済み。 */
  const { ImageResponse, loadGoogleFont } = await import("workers-og");
  const text = `${STATIC_TEXT}${title}${subtitle}`;
  const fonts = await Promise.all([
    loadGoogleFont({ family: FONT_FAMILY, weight: 400, text }),
    loadGoogleFont({ family: FONT_FAMILY, weight: 700, text }),
  ]);
  return new ImageResponse(buildHtml(title, subtitle), {
    ...OG_SIZE,
    fonts: [
      { name: FONT_FAMILY, data: fonts[0], weight: 400, style: "normal" },
      { name: FONT_FAMILY, data: fonts[1], weight: 700, style: "normal" },
    ],
  });
  /* v8 ignore stop */
}

export async function renderMemberOg(summary: MemberSummary): Promise<Response> {
  return imageResponse(summary.fullName, tagLine(summary));
}

export async function renderDefaultOg(): Promise<Response> {
  return imageResponse("UBM 兵庫支部会", "メンバーディレクトリと活動紹介");
}
