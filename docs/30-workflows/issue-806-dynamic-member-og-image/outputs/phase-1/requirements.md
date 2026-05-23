# Phase 1 成果物: 要件定義（実装サマリ）

source: `../../phase-1-requirements.md` に準拠。

- FR-1: `/members/[id]/opengraph-image` への GET request で 1200×630 PNG を返す
- FR-2: member detail page の `og:image` / `twitter:image` が member-specific path を指す
- FR-3: 存在しない / publicConsent=false の id は `notFound()` 経由で 404
- FR-4: root OG と同じ gradient を流用、氏名を主見出し / 肩書きを副見出し

NFR: OpenNext Cloudflare build compatible next/og ImageResponse / route-level `runtime = "edge"` 指定なし / D1 直接アクセス禁止維持
