<!-- workflow: members-list-ux-clarity / phase: index -->

# members-list-ux-clarity

## 概要

公開 `/members` ページの UX 改善ワークフロー。プロトタイプ整合は既に達成済 (`completed-tasks/members-list-prototype-alignment/`) だが、
**現行 UI では「密度切替の意味」「絞り込みが即発火する仕組み」「適用中の条件の可視化」がユーザーに伝わらない**という観察課題を解消する。

既存 API surface、URL query 正本、design tokens、primitives 構成は不変。あくまで affordance (説明文・aria-live・chip 列・ヘルプアイコン等) と
既存 primitive のラベル/補助テキスト追加に閉じる。

## スコープ

- `/members` route (Server Component) + 関連 client components
  - `DensityToggle.client.tsx` — 各モードの意味伝達 (ラベル併記/ヘルプ/aria-description)
  - `MemberFilters.client.tsx` — live-filter affordance (補足ヒント / 適用中 chip 列 / クリア配置最適化 / "結果X件" live region)
  - `MemberGrid.tsx` / `MemberCard.tsx` — 密度 mode 切替時の視認補助 (preview microcopy、density マークアップに data-* 追加)
  - `apps/web/app/(public)/members/page.tsx` — 件数 propagation・aria-live region への結果数渡し
- 関連 Playwright spec / vitest spec
- design tokens / 新 primitive は追加しない

## Boundary (不変条件)

| ID | 不変条件 |
| -- | -------- |
| INV-1 | 既存 API endpoint surface を維持 (新 endpoint 追加・D1 schema 変更・Google Form 変更すべて禁止) |
| INV-2 | URL query 正本 (`q`/`zone`/`status`/`sort`/`tag`/`density`) を維持し、内部 state へ移行しない |
| INV-3 | 新 primitive を生やさない。既存 `Segmented` / `FormField` / `Search` / `Select` / `TagPicker` / `Chip` のみで構成する |
| INV-4 | OKLch tokens (`--ubm-color-*` 等) のみ使用。HEX 直書き禁止 (`verify-design-tokens` CI gate 維持) |
| INV-5 | プロトタイプ正本 (`claude-design-prototype/pages-public.jsx`) と矛盾しない (構造・順序の正本) |
| INV-6 | `listMembers` の引数互換を維持し、Server Component 構造 (await connection → safeServerFetch) を変更しない |

## 状態

- 仕様書状態: `spec_created`
- branch: `feat/members-list-ux-clarity`
- 親ワークフロー候補: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` (派生 UX 改善)

## Phase 4 タスク分割案 (3 タスク・1 サイクル完了スコープ)

| Task | スラッグ | 主責務 | 主要変更ファイル | 想定 LOC | 並列可否 |
| ---- | -------- | ------ | ---------------- | -------- | -------- |
| **A** | `density-toggle-ux-clarity` | DensityToggle の意味伝達: 各モードに sublabel + `<details>` HelpHint + aria-describedbyを追加する。プロトタイプ既存ラベル "ゆったり / 密 / リスト" は維持し、説明テキストを下層に追加する。 | `DensityToggle.client.tsx`, `Segmented.tsx`, `legacy-public.css`, `__tests__/DensityToggle.client.spec.tsx` | +90 / -0 | 単独 |
| **B** | `member-filters-live-affordance` | MemberFilters の live-filter affordance: (1) 検索バー右下に "入力すると即反映" microcopy + キーボードヒント、(2) `aria-live=polite` で "結果 X 件" 通知 (debounce 200ms 想定の prop 設計のみ・本 task は count prop 渡しまで)、(3) 適用中条件 chip 列を `SelectedFiltersBar` (既存 `SelectedTagsBar` を一般化) で可視化、(4) クリアボタンを `hasFilters` の時のみ強調表示 (variant=primary)、配置を chip 列の右に移す。 | `MemberFilters.client.tsx`, `SelectedTagsBar.client.tsx` → `SelectedFiltersBar.client.tsx` (rename or 拡張)、`legacy-public.css`, `__tests__/MemberFilters.client.spec.tsx`, `__tests__/SelectedFiltersBar.client.spec.tsx` | +180 / -40 | 単独 |
| **C** | `members-page-integration-and-visual-baseline` | Task A/B の `/members` page 統合 + 結果件数 propagation (`MemberFilters` に `totalCount`/`displayedCount` prop 追加・aria-live 通知に消費) + 既存 Playwright `members-prototype-alignment.spec.ts` 更新 + 新規 visual baseline `members-ux-clarity.spec.ts` (4 viewport × 3 density × 2 state(empty / filtered))。 | `apps/web/app/(public)/members/page.tsx`, `apps/web/playwright/tests/members-ux-clarity.spec.ts`, baseline PNG (user-gated) | +100 / -10 | A/B 完了後の serial |

> **タスク分割原則**: Task A は DensityToggle 内部 (props 拡張 + microcopy + a11y) で閉じ、Task B は MemberFilters 内部 + chip 列 component + prop API で閉じる。Task C は page.tsx 統合と visual baseline のみで、UI 内部実装には踏み込まない。
>
> Task C のみ "結果件数" の渡しを行うため、Task B の prop API (`totalCount` / `displayedCount`) を Task B 設計の時点で固定し、Task C はその shape をそのまま消費する。

### 1 サイクル完了スコープ (CONST_007) の根拠

- 3 タスク合計推定 +400 / -60 LOC、新規 primitive 0 件、API 変更 0 件
- 既存 spec の更新と新規 visual spec 1 本のみ
- `verify-design-tokens` / `playwright-smoke` 既存 CI gate で品質担保

## 主要参照

- 親ワークフロー (構造模倣): `docs/30-workflows/completed-tasks/members-list-prototype-alignment/`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` (L155-340 `MemberCardPublic` / `PublicDirectoryPage`)
- design tokens: `docs/00-getting-started-manual/specs/design-tokens.md` + `apps/web/src/styles/tokens.css`
- CLAUDE.md 不変条件: UI alignment 不変条件 #1〜#4
- 既存実装: `apps/web/src/components/public/{DensityToggle,MemberFilters,MemberGrid,MemberCard}.{client.,}tsx`

## 成果物 (本 Phase 1-3 で生成)

| ファイル | 役割 |
| -------- | ---- |
| `index.md` | (本書) 概要・スコープ・タスク表 |
| `phase-1-requirements.md` | 要件定義 (背景 / ペルソナ / 問題 / AC / out-of-scope) |
| `phase-2-design.md` | 設計 (UI 構造 / mode 用途 / live-filter UX / a11y / data-*) |
| `phase-3-design-review.md` | 設計レビュー (代替案比較・採用根拠・risks・open questions) |
| `artifacts.json` | workflow root metadata (gates: Gate-A pending) |

Phase 4 以降 (`tasks/A,B,C` 仕様書) は別エージェントが担当する。

## Phase 12 strict 7 集約

parent + sub-workflow 構造のため、Phase 12 strict 7 は `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/` に集約する。sub task配下にstrict 7を複製しない。sub task固有のPhase 11証跡はsub配下、最終complianceは親rootで集約する。
