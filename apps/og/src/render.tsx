import type { MemberSummary } from "./member-source";
import {
  OG_BRAND,
  OG_LAYOUT,
  OG_SIZE,
  OG_TYPO,
  titleFontSize,
} from "./og-tokens";

export { OG_SIZE };

const STATIC_TEXT = "UBM Hyogo Member Directory";

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
  const escapedTitle = escapeHtml(title);
  const escapedSubtitle = escapeHtml(subtitle);
  const computedTitleFontSize = titleFontSize(title);

  return [
    `<div style="display:flex;width:${OG_LAYOUT.width}px;height:${OG_LAYOUT.height}px;background:${OG_BRAND.surface};font-family:'${OG_TYPO.fontFamily}',sans-serif;color:${OG_BRAND.ink};padding:${OG_LAYOUT.outerPadPx}px;box-sizing:border-box;">`,
    `<div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;border:${OG_LAYOUT.cardBorderPx}px solid ${OG_BRAND.line};border-radius:${OG_LAYOUT.cardRadiusPx}px;padding:${OG_LAYOUT.cardPadPx}px;background:${OG_BRAND.panel};box-shadow:0 20px 48px rgba(24,23,20,0.10);">`,
    `<div style="display:flex;align-items:center;gap:20px;font-size:${OG_TYPO.eyebrowFontPx}px;color:${OG_BRAND.accentInk};font-weight:700;letter-spacing:${OG_TYPO.eyebrowTracking};text-transform:uppercase;">`,
    `<div style="display:flex;width:${OG_LAYOUT.dotPx}px;height:${OG_LAYOUT.dotPx}px;border-radius:999px;background:${OG_BRAND.accent};box-shadow:0 0 0 10px ${OG_BRAND.accentSoft};"></div>`,
    `<div style="display:flex;">UBM Hyogo</div>`,
    `</div>`,
    `<div style="display:flex;flex-direction:column;gap:${OG_LAYOUT.stackGapPx}px;max-width:920px;">`,
    `<div style="display:flex;font-size:${computedTitleFontSize}px;line-height:1.08;font-weight:800;letter-spacing:0;">${escapedTitle}</div>`,
    `<div style="display:flex;font-size:${OG_TYPO.subtitleFontPx}px;line-height:1.35;color:${OG_BRAND.body};">${escapedSubtitle}</div>`,
    `</div>`,
    `<div style="display:flex;align-items:center;justify-content:space-between;font-size:${OG_TYPO.footerFontPx}px;color:${OG_BRAND.muted};">`,
    `<div style="display:flex;">Member Directory</div>`,
    `<div style="display:flex;width:160px;height:6px;border-radius:999px;background:${OG_BRAND.accentSoft};"><div style="display:flex;width:58px;height:6px;border-radius:999px;background:${OG_BRAND.accent};"></div></div>`,
    `</div>`,
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
    loadGoogleFont({ family: OG_TYPO.fontFamily, weight: 400, text }),
    loadGoogleFont({ family: OG_TYPO.fontFamily, weight: 700, text }),
  ]);
  return new ImageResponse(buildHtml(title, subtitle), {
    ...OG_SIZE,
    fonts: [
      { name: OG_TYPO.fontFamily, data: fonts[0], weight: 400, style: "normal" },
      { name: OG_TYPO.fontFamily, data: fonts[1], weight: 700, style: "normal" },
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
