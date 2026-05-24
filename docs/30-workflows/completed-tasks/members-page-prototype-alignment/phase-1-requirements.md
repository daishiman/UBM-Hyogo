# Phase 1: 要件定義

## 1. メタ情報

- `taskType`: `implementation`
- `visualEvidence`: `VISUAL`（公開画面の見た目修正のため Phase 11 で screenshot 必須）
- `implementation_mode`: `existing-ui-alignment`（既存実装の hardening / 整合化。新規 page 作成ではない）
- `workflow_state`: `implemented_local_evidence_captured`

## 2. 目的

staging `/members` 画面とプロトタイプの視覚的・構造的乖離 7 項目（[index.md](index.md) §背景）を、既存 API・既存 token・既存 primitive のみで解消する。
新 endpoint / 新 token / 新 primitive を作らず、最小差分でプロトタイプ準拠の見た目に揃える。

## 3. 受け入れ基準（AC）

| ID | 受け入れ基準 | 検証方法 |
|---|---|---|
| AC-1 | PublicHeader が水平 nav として描画され、`brand`（左）/ nav links（中央 or 右）/ auth-cta（右端）の 3 ブロック構造で `data-component="public-header"` 配下に並ぶ | Playwright smoke で `getByRole("banner")` 内に `getByRole("link", { name: "ログイン" })` を含み、computed `display !== "block"` |
| AC-2 | PublicFooter が水平 flex で、リンク群と copyright が左右配置になる | smoke + computed style 確認 |
| AC-3 | DensityToggle が `Segmented` primitive を採用し `role="radiogroup"` + 3 `role="radio"` を出力、`aria-checked="true"` が現行密度の 1 個のみ | unit spec `DensityToggle.client.spec.tsx` |
| AC-4 | MemberFilters が `data-component="member-filters"` 配下で desktop 時に grid（検索 / zone / status / sort / clear）の 5 列構造、mobile (≤900px) で 1 列縦積み | unit spec + visual check |
| AC-5 | `density="comfy"` 時 MemberGrid が `minmax(320px, 1fr)` の auto-fill、`density="dense"` 時 `minmax(260px, 1fr)` の auto-fill、`density="list"` 時 MemberTable が `.mrow` 5 列 grid | CSS rule 存在 + visual check |
| AC-6 | 空状態が中央寄せ・アイコン上・「絞り込みをクリア」CTA 付き構造になる | smoke で `getByRole("status")` |
| AC-7 | page-head が eyebrow(`MEMBERS`)+ h1(`メンバー一覧`) + muted 説明文の 3 段構造 + 右側に Segmented を配置（mobile では縦積み） | smoke で文字列 + computed flex direction |
| AC-8 | `apps/web` 配下に新規 HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が増えない | `pnpm verify:tokens` または `pnpm --filter @ubm-hyogo/web verify-design-tokens` / `rg "#[0-9a-fA-F]{6}" apps/web/src --type tsx --type css` で新規 0 件 |
| AC-9 | 既存 API endpoint `GET /public/members` の query / response shape が変わらない | `git diff dev -- apps/api/src/routes/public/members.ts apps/api/src/use-cases/public/list-public-members.ts apps/api/src/view-models/public/public-member-list-view.ts` が空 |
| AC-10 | URL query 正規化 `apps/web/src/lib/url/members-search.ts` の export 公開 API が変わらない | 上記同様 git diff 空 |
| AC-11 | `pnpm typecheck` / `pnpm lint` / `pnpm build` 成功 | CI |
| AC-12 | Playwright `members-prototype-alignment.spec.ts` 新規 smoke が pass | CI |

## 4. スコープ外（先送り禁止条件下での明示）

CONST_007 に従い、本ワークフロー内で完了させる項目を全て上に挙げた。以下は明示的に対象外（先送りではなく機能上本タスクと無関係）:

- 詳細ページ `/members/[id]` のレイアウト改修
- ページネーション UI の追加
- 新フィルタ種別追加（mobile filter drawer 等）
- admin 画面の chrome 統一

> 上記が本サイクル内に含まれないのは「機能スコープ外」のためであり、「将来送り」ではない。

## 5. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| `Segmented` primitive 既存実装がプロトタイプの 3-pill 形状と微差 | DensityToggle の見た目ズレ | Phase 2 で `apps/web/src/components/ui/Segmented.tsx` を読み、必要なら data attribute 1-2 個追加で吸収 |
| `legacy-public.css` に既存 selector との衝突 | CSS cascade 破壊 | Phase 5 で `@layer components` 末尾追記、既存ルールを編集せず追加のみ |
| Playwright smoke が staging 依存になる | CI 安定性 | smoke は localhost dev server で実行（既存 `playwright/tests/` と同パターン） |

## 6. 完了条件

- artifacts.json 生成 / `phases[1].status = completed`
- 本ファイル AC 表が全埋め
- 次フェーズに進む準備完了
