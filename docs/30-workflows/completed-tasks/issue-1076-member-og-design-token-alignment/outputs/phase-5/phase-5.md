# Phase 5 — 実装（手順）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

> 本フェーズは **手順仕様** であり、本 wave で実装済み。
> 後続の実装実行者は以下の手順どおりに `apps/og` のコードを変更し、TDD Green を達成する。

## 5.1 変更ファイル一覧（FB-RT-03）

### 新規作成

| パス | 役割 |
| --- | --- |
| `apps/og/src/og-tokens.ts` | 色 (`OG_BRAND`) / タイポ (`OG_TYPO`) / レイアウト (`OG_LAYOUT`) 定数 + `titleFontSize`（tokens.css 正本 hex の派生コピー） |
| `apps/og/src/__tests__/og-tokens.spec.ts` | 正本 hex 一致のドリフトガード + `titleFontSize` 境界（Phase 4 §4.3） |

### 修正

| パス | 変更内容 |
| --- | --- |
| `apps/og/src/render.tsx` | ローカル `BRAND` 定数を削除し `og-tokens` から import。`buildHtml` を `OG_BRAND` / `OG_LAYOUT` / `OG_TYPO` / `titleFontSize` 参照へ置換 |
| `apps/og/src/__tests__/render-html.spec.ts` | `OG_BRAND` import 追加 + TC-HTML-04..08 追加（青系 hex 不在 / 正本 hex 含有 / default・member・フォールバック）（Phase 4 §4.4） |
| `apps/og/src/__tests__/render-smoke.spec.ts` | 既存維持。改修後も PNG 応答契約が崩れないことを確認（Phase 4 §4.5） |

> `apps/web` / `apps/api` / D1 / Google Form / `og-cd.yml` は変更しない（Phase 1 §1.1 対象外）。

## 5.2 実装ステップ（順序）

### ステップ① `apps/og/src/og-tokens.ts` を新規作成

Phase 2 §2.3 の構造を**そのまま**実装する。出典コメント（正本 = `tokens.css`、accent 系は `@supports` フォールバック block 由来）を JSDoc に明記する。

- `export const OG_BRAND = { surface, panel, ink, body, muted, line, accent, accentInk, accentSoft } as const;`（各値は Phase 2 §2.3 の hex）
- `export const OG_TYPO = { fontFamily: "Noto Sans JP", eyebrowTracking, titleMaxFontPx: 76, titleMinFontPx: 54, titleShrinkThreshold: 14, subtitleFontPx: 32, eyebrowFontPx: 28, footerFontPx: 24 } as const;`
- `export const OG_LAYOUT = { width: 1200, height: 630, outerPadPx: 64, cardPadPx: 56, cardRadiusPx: 36, cardBorderPx: 2, dotPx: 18, stackGapPx: 28 } as const;`
- `export function titleFontSize(title: string): number`（code point 計測 `[...title].length`、戻り値 76 / 64 / 54 の離散・決定論的）

### ステップ② `apps/og/src/render.tsx` を改修

1. ファイル先頭でローカル `const BRAND = { ... }` を**削除**する。
2. `import { OG_BRAND, OG_LAYOUT, OG_TYPO, titleFontSize } from "./og-tokens";` を追加。
3. `FONT_FAMILY` は `OG_TYPO.fontFamily` を参照に寄せてよい（既存 `OG_SIZE` は `OG_LAYOUT.width/height` と同値なので Phase 2 整合のため `OG_LAYOUT` 参照へ統一可）。
4. `buildHtml(title, subtitle)` の引数 signature は**不変**（後方互換・既存呼び出し全互換）。内部の inline style を Phase 2 §2.4 の表に従い `OG_BRAND` / `OG_LAYOUT` / `OG_TYPO` / `titleFontSize(title)` 参照へ置換する:
   - 外枠: `background: OG_BRAND.surface` / `padding: OG_LAYOUT.outerPadPx` / `font-family: OG_TYPO.fontFamily`
   - カード: `background: OG_BRAND.panel` / `border: {OG_LAYOUT.cardBorderPx}px solid OG_BRAND.line` / `border-radius: OG_LAYOUT.cardRadiusPx` / `padding: OG_LAYOUT.cardPadPx`
   - eyebrow: dot（`OG_LAYOUT.dotPx` 円・`OG_BRAND.accent`）+ "UBM Hyogo"。`color: OG_BRAND.accentInk` / `font-size: OG_TYPO.eyebrowFontPx` / `font-weight:700` / `letter-spacing: OG_TYPO.eyebrowTracking`
   - title: `font-size: titleFontSize(title)` / `color: OG_BRAND.ink` / `font-weight:800` / `line-height:1.05`
   - subtitle: `font-size: OG_TYPO.subtitleFontPx` / `color: OG_BRAND.body` / `line-height:1.4`
   - footer "Member Directory": `color: OG_BRAND.muted` / `font-size: OG_TYPO.footerFontPx` / `letter-spacing: OG_TYPO.eyebrowTracking`
5. `render.tsx` 本文から **literal hex を排除**（全色は `OG_BRAND` 経由）。`escapeHtml` / `tagLine` / `renderMemberOg` / `renderDefaultOg` / `imageResponse` / `renderStaticFallbackOg` の経路と `v8 ignore` block は変更しない。

### ステップ③ テスト更新

- `og-tokens.spec.ts` を Phase 4 §4.3 の TC-OGT-01..16 で作成。
- `render-html.spec.ts` に `OG_BRAND` import と TC-HTML-04..08 を追加（既存 escapeHtml / tagLine / TC-HTML-03 は維持）。
- `render-smoke.spec.ts` は変更不要（既存維持で TC-SMOKE-01 Green 継続を確認）。

### ステップ④ Green 確認

`mise exec -- pnpm --filter @ubm-hyogo/og test` を実行し、全テスト PASS（Red → Green）を確認する。

## 5.3 ローカル実行・検証コマンド

```bash
# テスト（Green 確認）
mise exec -- pnpm --filter @ubm-hyogo/og test

# 型チェック / lint（AC-7）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# build + size gate（AC-5: Free 3MiB 上限内 / font は runtime fetch のまま非 bundle）
mise exec -- pnpm --filter @ubm-hyogo/og build
bash scripts/check-worker-size.sh apps/og/dist
```

## 5.4 DoD（Definition of Done）チェックリスト

| # | 条件 | 対応 AC | 検証 |
| --- | --- | --- | --- |
| DoD-1 | `og-tokens.spec.ts` の TC-OGT-01..16 が全 PASS（正本 hex 一致 + `titleFontSize` 境界） | AC-1 / AC-3 | `pnpm --filter @ubm-hyogo/og test` |
| DoD-2 | `render-html.spec.ts` で正本 hex 含有（TC-HTML-04）かつ青系 hex `#0068a9`/`#172033`/`#526070`/`#f8fafc`/`#c9d6e2` を 1 つも含まない（TC-HTML-05） | AC-1 | 同上 |
| DoD-3 | default / member（occupation 有）/ member（フォールバック）の title・subtitle が反映（TC-HTML-06..08） | AC-2 / AC-3 | 同上 |
| DoD-4 | `render-smoke.spec.ts` の TC-SMOKE-01 が PASS（PNG 応答契約維持） | AC-4 | 同上 |
| DoD-5 | 既存 `router.spec.ts` / `member-source.spec.ts` / `router-error.spec.ts` が全 PASS（非回帰） | AC-6 | 同上 |
| DoD-6 | OG Worker bundle が Free 3MiB 上限内（font 非 bundle 維持） | AC-5 | `bash scripts/check-worker-size.sh apps/og/dist` |
| DoD-7 | `pnpm typecheck` / `pnpm lint` が緑 | AC-7 | 上記コマンド |
| DoD-8 | `render.tsx` 本文に literal hex が残っていない（色は全て `OG_BRAND` 経由） | AC-1 | grep / TC-HTML-04..05 |

## 5.5 注記

- 本 wave で実装済み。上記はすべて後続実装者向けの手順記述。
- コミット / PR / push はユーザー明示承認後のみ。本フェーズ範囲外。
- 値（hex / px / tracking）はすべて Phase 2 §2.3 を正本とし、独自値を新設しない。
