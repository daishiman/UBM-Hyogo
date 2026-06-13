# Phase 4 成果物 — test-plan（旧/新 assertion 表 + 新文言・eyebrow 不在 assertion）

> 正本: [`../../_shared-context.md`](../../_shared-context.md) §1E。

## 1. ファイル別 旧/新 assertion 表

### T1 `apps/web/src/components/public/__tests__/Stats.component.spec.tsx`

| 行 | 旧 assertion | 新 assertion | 期待値 | 操作対象 |
| --- | --- | --- | --- | --- |
| L69 | `expect(...).toContain("Forms 同期中")` | `expect(...).toContain("自動で最新化")` | 同期バッジ = `自動で最新化` | props（`stats`） |
| 新規 it | （なし） | `[data-stat="members"] [data-role="label"]` の textContent | `公開メンバー` | props |
| 新規 it | （なし） | `[data-stat="zones"] [data-role="label"]` の textContent | `事業フェーズ` | props |
| 新規 it | （なし） | `[data-stat="meetings"] [data-role="label"]` の textContent | `年間の支部会` | props |
| 新規 it | （なし） | `[data-stat="sync"] [data-role="label"]` の textContent | `最終データ更新` | props |

### T2 `apps/web/src/components/public/__tests__/AboutUbm.component.spec.tsx`

| 行 | 旧 assertion | 新 assertion | 期待値 | 操作対象 |
| --- | --- | --- | --- | --- |
| L33-39 | 「renders both eyebrows ABOUT and THREE ZONES」 | `querySelectorAll('[data-role="eyebrow"]').length === 0` | eyebrow 0 件 | props |
| L33-39 | （eyebrow 文言 assert） | `section-heading` の textContent | `事業支援コミュニティ「UBM」` / `UBM区画` | props |

### T3 `apps/web/src/components/public/__tests__/Timeline.component.spec.tsx`

| 行 | 旧 assertion | 新 assertion | 期待値 | 操作対象 |
| --- | --- | --- | --- | --- |
| L23-25 | eyebrow `RECENT MEETINGS` の assert | （削除） | — | props |
| L36 | `[data-role="eyebrow"]` truthy | `[data-role="section-heading"]` truthy | `最近の支部会` | props |

### T4 `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`

| 行 | 旧 assertion | 新 assertion | 期待値 | 操作対象 |
| --- | --- | --- | --- | --- |
| L80-83 | 「eyebrow text 'FOR MEMBERS'」it | （削除） | — | props |
| L91 | `[data-role="eyebrow"]` `.not.toBeNull()` | `[data-role="eyebrow"]` `.toBeNull()` | eyebrow 不在 | props |
| L85 | data-role 列挙に `eyebrow` 含む | data-role 列挙から `eyebrow` 除外 | eyebrow を含まない | props |

## 2. 変更不要

| ファイル | 理由 |
| --- | --- |
| `app/(public)/page.spec.tsx` | 全セクション stub 済・FEATURED MEMBERS overline 未 assert |
| `Hero.component.spec.tsx` | Hero は eyebrow prop 保持・home が渡さないだけ |

## 3. 新文言 assertion 一覧

- `公開メンバー`（members ラベル）
- `事業フェーズ`（zones ラベル）
- `年間の支部会`（meetings ラベル）
- `最終データ更新`（sync ラベル）
- `自動で最新化`（同期バッジ）

## 4. eyebrow 不在 assertion 一覧

- AboutUbm: `[data-role="eyebrow"]` の length === 0（ABOUT / THREE ZONES 両方が消える）
- Timeline: eyebrow assert 削除 + `[data-role="section-heading"]`（`最近の支部会`）truthy
- CallToActionCTA: `[data-role="eyebrow"]` === null + data-role 列挙から eyebrow 除外

## 5. 命名規則整合

- T1–T4 はすべて `*.component.spec.tsx`（`*.spec.{ts,tsx}` のみ・`*.test` 禁止＝CLAUDE.md 不変条件 #8）。
- 新規テストファイルの追加は無し（既存編集のみ）。focused 実行は SSOT §4-1 の 5 ファイル一括コマンドに含まれる。
