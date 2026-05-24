# members-page-prototype-alignment

> **実装区分**: 実装仕様書（CONST_004 デフォルト適用 / CONST_005 必須項目を全 Phase で記述）
> **状態**: `implemented_local_evidence_captured` / `implementation` / `VISUAL`
> **作成日**: 2026-05-23
> **対象 route**: `/members`（公開ディレクトリ）+ public AppShell（PublicHeader / PublicFooter）
> **正本順位**:
> 1. プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` `MemberListPage` (L207-L336)
> 2. プロトタイプ CSS: `docs/00-getting-started-manual/claude-design-prototype/styles.css` (member-grid / segmented / tag-pill)
> 3. 既存 design token: `apps/web/src/styles/tokens.css`（OKLch 正本・本タスクで token 新規追加なし）
> 4. 既存 API: `GET /public/members`（**新規 endpoint 追加禁止 / D1 schema 変更禁止**）

## 背景

staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members` が次の状態でプロトタイプと大きく乖離している:

1. PublicHeader / PublicFooter が「裸テキストの縦並びリンク」になっており、背景・レイアウト・hover/active が一切ない
2. 表示密度切替が radio + FormField 構成で、プロトタイプの `Segmented`（pill 形状の inline-flex）になっていない
3. MemberFilters のフィルタ群が `card.card-pad` 風レイアウト（grid `1.5fr 1fr 1fr 1fr auto`）になっておらず縦積み化
4. `density="list"` 時の MemberTable / MemberCard が `.member-grid-list` / `.mrow` 相当のスタイル不在
5. page-head の eyebrow / h-page / muted のタイポ階層が未適用
6. 空状態が `.card.empty-state` の中央寄せ・余白・アイコン構造になっていない

## スコープ

| 区分 | 含む | 含まない |
|---|---|---|
| 画面 | `/members`（一覧） + public layout 共通 chrome（Header / Footer） | `/members/[id]`（詳細）、`/`、`/register`、`/login`、admin |
| 振る舞い | 既存 query param / URL state / API 接続をそのまま流用しつつスタイル・DOM 最小変更で整える | 新しい filter / sort 種別の追加、API endpoint 追加、D1 変更、i18n、ページネーション UI 追加 |
| Token | `apps/web/src/styles/tokens.css` 既存 token のみ参照 | 新規 token 追加、HEX 直書き |
| Test | Vitest（unit）+ Playwright smoke を **既存ファイルに追加** | E2E 大規模再設計 |

> **CONST_007 適用**: 本ワークフローは単一サイクルで完了させる。Header / Footer chrome を別タスクへ先送りしない（同一画面でユーザーが目視するため分離不可）。

## 不変条件

1. `apps/web` から D1 直接アクセス禁止（API 経由のみ。CLAUDE.md §「重要な不変条件」5）
2. 色は token 経由のみ。HEX / `bg-[#xxx]` 直書き禁止（CI `verify-design-tokens` が fail 判定）
3. 既存 API endpoint surface（`GET /public/members`）の query / response shape を変更しない
4. 既存の URL query 正規化（`apps/web/src/lib/url/members-search.ts`）を破壊しない
5. `*.spec.{ts,tsx}` のみ追加（`*.test.{ts,tsx}` 禁止）
6. プロトタイプ未掲載要素を新規 primitive として生やさない（既存 `Segmented` / `FormField` / `Avatar` を活用）

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 / 受け入れ基準 / visualEvidence=VISUAL 確定 |
| 2 | [phase-2-design.md](phase-2-design.md) | DOM / CSS / コンポーネント設計（実装ターゲット詳細） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー（プロトタイプ突合せ） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（unit / smoke / visual） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（ファイル別 diff 方針） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | 追加テスト |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ（必要時のみ） |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA / typecheck / lint / build |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト + screenshot evidence |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント・概念説明 |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 |

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
|---|---|---|
| `apps/web/src/components/public/PublicHeader.tsx` | 編集 | `data-component="public-header"` 構造保持、内部 markup 微調整（必要なら） |
| `apps/web/src/components/public/PublicFooter.tsx` | 編集 | 同上 |
| `apps/web/src/components/public/DensityToggle.client.tsx` | 編集 | RadioGroup + FormField を撤去し、既存 `Segmented` primitive を採用 |
| `apps/web/src/components/public/MemberFilters.client.tsx` | 編集 | コンテナに `data-component="member-filters"` 構造を保ったまま、active-tags / sort 配置を整理 |
| `apps/web/src/components/public/MemberCard.tsx` | 編集 | density variant に対応した `data-density` 出力と内部レイアウト（comfy / dense） |
| `apps/web/src/components/public/MemberGrid.tsx` | 編集 | comfy / dense の grid density を CSS hook として安定化 |
| `apps/web/src/components/public/MemberTable.tsx` | 編集 | list density 用の `data-component="member-table"` row 構造（grid 5 列）に整える |
| `apps/web/src/components/feedback/EmptyState.tsx` | 編集（必要時） | アイコン + 中央寄せ余白の構造を保証 |
| `apps/web/src/styles/legacy-public.css` | 編集 | `@layer components` に下記 selector を追加: `[data-component="public-header"]`, `[data-component="public-footer"]`, `[data-component="density-toggle"]`, `[data-component="member-filters"]`, `[data-component="member-card"][data-density="dense"]`, `[data-component="member-table"]`, `.page-head`, `.eyebrow`, `.h-page` 派生 |
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 新規/編集 | Segmented role / aria-checked / keyboard nav |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集 | 既存テストの assertion 微調整 |
| `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` | 新規 | density ごとの card hook / list density 表示差分 |
| `apps/web/playwright/tests/members-prototype-alignment.spec.ts` | 新規 | smoke + 主要 selector の存在確認 |

## DoD (Definition of Done)

- `pnpm typecheck` / `pnpm lint` / `pnpm build` 全成功
- 追加した `*.spec.tsx` および既存テストが全 pass
- staging deploy 後の `/members` スクリーンショットがプロトタイプと一致レベルで整合（Phase 11 evidence として保存）
- `pnpm verify:tokens` または `pnpm --filter @ubm-hyogo/web verify-design-tokens` が pass（HEX / `bg-[#xxx]` 直書きが新規追加されていない）
- PublicHeader / PublicFooter / DensityToggle / MemberFilters / MemberTable のすべてに対応 CSS selector が存在することを `rg` で確認

## 参照

- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` (L155-L336), `styles.css` (L536-L623, L1011-L1022), `index.html` (L11-L80)
- 既存 spec: `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` (L284-L553)
- 既存 token: `apps/web/src/styles/tokens.css`
- 関連完了 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
