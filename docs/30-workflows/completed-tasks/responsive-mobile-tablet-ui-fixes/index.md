# 全画面レスポンシブ（携帯・タブレット）UI/UX 是正タスク仕様書

- task_id: `responsive-mobile-tablet-ui-fixes`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。判定根拠は [phase-1-requirements.md](phase-1-requirements.md) 参照）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`
- workflow_state: `implemented_local_visual_present_staging_pending`（Phase 1-13 実装仕様書と local PNG 証跡を作成。commit / PR / authenticated admin staging 視覚証跡は user-gated）
- スコープ: `apps/web`（全 19 ルートの表現層 CSS / Tailwind breakpoint / レイアウト primitive）のみ。API/D1/Form 非変更（不変条件 #1 #5）

## 目的

UBM 兵庫支部会 メンバーサイトの **全 19 ルート**で、携帯サイズ（375px 相当）・タブレットサイズ（768px 相当）の
UI/UX を整える。現状は複数画面で**レイアウト崩れ・要素のはみ出し・画面外への隠れ（非表示化）・横スクロール強制**が発生しており、
ユーザーが内容を読めない / 操作できない箇所がある。これらを「どの画面・どのビューポートでも内容が隠れず、崩れず、操作可能」な状態へ是正する。

## 根本原因（コード調査で確定）

| ID | 根本原因 | 代表箇所 |
| --- | --- | --- |
| RC-1 | **ブレークポイント境界の不統一**。`globals.css` のメディアクエリが `max-width: 767px / 768px / 900px / 1024px` と混在し、Tailwind の `md(768)` / `lg(1024)` と境界がずれる。タブレット帯（768〜1024px）で多カラムが詰まる | `globals.css` L759-764 / L1376-1390 / L1730-1751 |
| RC-2 | **固定幅・最小幅起因のはみ出し**。`min(1120px, calc(100% - 40px))`、drawer `17rem`、`minmax(18rem, 0.9fr) minmax(22rem, 1.1fr)`（最小 640px）、attendance `minmax(18rem, 0.85fr)`、modal/popover の `min-width` が狭幅で本文を圧迫・はみ出し | `legacy-public.css` L3 / `globals.css` L1638-1639 / L1084-1085 / `tokens.css` L54-55 |
| RC-3 | **テーブルのレスポンシブ未対応**。`overflow-x: auto` のみでセルに `min-width` 設計がなく、携帯では横スクロールに content が押し出され見えなくなる。モバイル向けカードフォールバックなし | `globals.css` admin-audit-table / MembersTable 系 |
| RC-4 | **popover / tooltip の絶対配置がビューポート外**。collapsed sidebar の tooltip（`left: calc(100% + …)` `max-width: 240px`）と user menu popover が画面端で見切れる | `globals.css` L316-339 / L433-446 |
| RC-5 | **共通 3 画面（error/not-found/loading）と auth フォームの狭幅検証不足**。`width: min(100%, 420px)` 等が小型携帯（320-375px）で padding と競合 | `auth.css` L2 / `error.tsx` / `not-found.tsx` |

## スコープ（本サイクル完結＝AC-1..AC-10・CONST_007）

| 柱 | 内容 | 主な変更ファイル |
| --- | --- | --- |
| ブレークポイント統一 | 共通ブレークポイント（mobile-first: base / `md` 768 / `lg` 1024）を CSS カスタムプロパティ + コメント規約で固定し、`globals.css` の混在境界を統一 | `apps/web/src/styles/globals.css`, `apps/web/src/styles/tokens.css` |
| 固定幅の流体化 | 多カラムグリッドを mobile-first 単カラム→`md`/`lg` 多カラムへ。`minmax(Nrem,…)` の最小値起因はみ出しを `clamp()` / `minmax(0,…)` へ是正 | `globals.css`, `legacy-public.css` |
| テーブル可視性 | 管理テーブルに「カード積み（mobile）/ sticky 見出し + セル `min-width` 横スクロール（tablet）」フォールバックを付与し、content の隠れを解消 | `globals.css`, 該当テーブル component |
| オーバーレイ収納 | drawer / popover / tooltip / modal をビューポート内に収める（`clamp()` / `max-width` / flip / `inset` 安全化） | `globals.css`, `SidebarDrawer.tsx` 他 |
| 共通画面・auth | login 狭幅 padding を 375px で是正し、共通画面は既存構造を維持して runtime smoke で確認 | `auth.css` |
| テスト | 既存 Playwright visual full に横スクロール 0 guard を追加 + jsdom 構造 spec | `apps/web/playwright/tests/visual-full/full-visual.spec.ts`, `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` |

> **CONST_007 遵守**: 本タスクは「全 19 ルートのレスポンシブ是正」を 1 実装サイクルで完結させる。
> 崩れの根本は共通 CSS 層（`globals.css` / `legacy-public.css` / `tokens.css`）に集中しており、
> route 個別の改修は限定的。先送り（別 PR / Phase 2 / バックログ）は行わない。

## スコープ外（不変条件で禁止 / 別ドメイン）

- API endpoint 追加・D1 schema 変更・Google Form 仕様変更（不変条件 #1 #5）。レスポンシブ是正は UI 表現層のみで完結する。
- 配色・タイポグラフィの再設計（design token 正本は据置）。HEX 直書き禁止（不変条件 #2 / CI `verify-design-tokens`）。
- 新規デザイン primitive の追加（不変条件 #3。既存 primitives 群で構成）。

## Acceptance Criteria

[phase-1-requirements.md](phase-1-requirements.md) の AC-1..AC-10 を正本とする。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義（root cause / AC / 19 ルート inventory） | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（ブレークポイント体系・CSS / component 変更） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / スクリーンショット | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release | [phase-13-pr.md](phase-13-pr.md) |

## 共有コンテキスト

19 ルート inventory・ブレークポイント体系・root cause→AC→変更ファイルの trace は [shared-context.md](shared-context.md) に集約する（全 Phase の SSOT）。

## 完了条件

AC-1..AC-10 が全 Phase に trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録され、
`apps/web` 表現層のみで完結する実装手順（変更ファイル・CSS 差分方針・テスト・検証コマンド・DoD）が各 Phase に明記されていること。
`apps/web` 実装・focused Vitest・token/type/lint・local runtime smoke・local physical PNG 5 files は本サイクルで完了。commit / PR / authenticated admin staging 視覚証跡は user 明示承認後（Phase 13）に行う。
