# Phase 8: リファクタ

## 1. 本タスクでのリファクタ範囲

**なし**。

## 2. 検討したが見送った項目

| 項目 | 見送り理由 |
|---|---|
| `fetchProfile(id)` の共通 helper 化（`apps/web/src/lib/fetch/public-member.ts` への抽出） | 現状 callsite 2 件（page.tsx / opengraph-image/route.tsx）。inline 重複 8 行は abstraction cost を下回る。`CONST_007` の「先送り」ではなく「現時点で抽出する benefit がない」判断 |
| OG gradient の design token 化（CSS var bridge） | `next/og` `ImageResponse` は Satori renderer で Tailwind / CSS variable を resolve できない。root opengraph-image.tsx も HEX 直書き。新規 followup 検討対象として Phase 12 §未タスク検出に記録 |
| フォント埋め込み（`cf-fonts` 等で日本語 glyph 安定化） | 事前には抽出しない。TC-4 目視で tofu が出た場合は同一実装サイクル内で修正する。runtime / bundle 制約で同一サイクル修正が破綻すると判明した場合のみエスカレーションして未タスク化する |

## 3. リファクタを将来扱う場合の入口

- 共通 helper 化: callsite が 3 以上になった時点で `apps/web/src/lib/fetch/public-member.ts` に抽出
- フォント埋め込み: `apps/web/public/fonts/NotoSansJP-Bold.ttf` を fetch して `ImageResponse({..., fonts: [...]})` に渡す pattern。Workers binding size と weigh する
