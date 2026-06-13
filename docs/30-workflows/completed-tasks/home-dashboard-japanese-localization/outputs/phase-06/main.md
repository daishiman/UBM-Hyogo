# Phase 6 outputs — テスト拡充の詳細

> SSOT: `../../_shared-context.md` §1.E / §4。

## テスト更新詳細（T1–T4）

### T1 — `Stats.component.spec.tsx`

- **既存 L69**: `expect(...).toContain("Forms 同期中")` → `toContain("自動で最新化")` に更新。
- **新規 it**: 「統計 4 ラベルが日本語であること」を追加。
  - `[data-stat="members"] [data-role="label"]` のテキストが `公開メンバー`
  - `[data-stat="zones"] [data-role="label"]` のテキストが `事業フェーズ`
  - `[data-stat="meetings"] [data-role="label"]` のテキストが `年間の支部会`
  - `[data-stat="sync"] [data-role="label"]` のテキストが `最終データ更新`
- **不変 assert（維持）**: `data-role="value"` / `data-role="sub"` / `data-role="dot"` の存在・テキストは従来どおり。`stats-heading` id・`aria-labelledby` は不変。

### T2 — `AboutUbm.component.spec.tsx`

- **既存 L33-39**「renders both eyebrows ABOUT and THREE ZONES」を**置換**:
  - `container.querySelectorAll('[data-role="eyebrow"]')` の length が **0** であること。
  - `section-heading` が「事業支援コミュニティ「UBM」」「UBM区画」であること（2 つの article の見出し）。

### T3 — `Timeline.component.spec.tsx`

- **既存 L23-25**: eyebrow `RECENT MEETINGS` の assert を**削除**。
- **既存 L36**「header still rendered」: `[data-role="eyebrow"]` truthy → `[data-role="section-heading"]`（テキスト「最近の支部会」）truthy に変更。
- header（`data-role="header"`）・`chip-cadence` の存在 assert は不変。

### T4 — `CallToActionCTA.component.spec.tsx`

- **既存 L80-83**「eyebrow text 'FOR MEMBERS'」it を**削除**。
- **既存 L91**: `[data-role="eyebrow"]` `.not.toBeNull()` → `.toBeNull()`（eyebrow が存在しないことを assert）。
- **既存 L85**: data-role 列挙文言から `eyebrow` を除外（heading / body / cta-button などは維持）。

## 変更不要ファイル

| ファイル | 理由 |
| --- | --- |
| `app/(public)/page.spec.tsx` | 全セクション stub 済。FEATURED MEMBERS overline は未 assert のため影響なし |
| `Hero.component.spec.tsx` | Hero は eyebrow prop を保持。単体テストのサンプル文言のみ日本語へ更新 |

## 回帰ガード（fail path 含む）

1. **英語残存 grep**（SSOT §4-4）— ヒット 0。Phase 5 の置換漏れがあるとここで検出。
2. **eyebrow 収束 grep** — `data-role="eyebrow"` が home 系で Hero.tsx の描画箇所のみに収束。eyebrow 復活時に検出。
3. **API 非接触** — `git diff dev -- apps/api packages/shared` が空。
4. **fail path**: T1 のラベル assert / T2-T4 の eyebrow 不在 assert は、Phase 5 の置換・削除が漏れると確実に fail する（緑が空虚でない）。

## focused vitest（SSOT §4-1）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/public/__tests__/Stats.component.spec.tsx \
  src/components/public/__tests__/AboutUbm.component.spec.tsx \
  src/components/public/__tests__/Timeline.component.spec.tsx \
  src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  app/(public)/page.spec.tsx
```

全 PASS を DoD とする。
