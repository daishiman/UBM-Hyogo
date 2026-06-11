# admin-tag-definition-unify-create-and-catalog-fix

## 概要

admin の**タグ定義系 UI を統合**し、3 つの課題を 1 サイクルで解決する実装仕様。

1. **タグカタログのクラッシュ修正** — `/admin/tags/catalog` の `TypeError: Cannot read properties of undefined (reading 'reduce')`（`TagCatalogPanel` の `initial.items` 防御欠如）を UI adapter 層の防御正規化で根絶。
2. **新規タグ作成機能の追加** — API `POST /admin/tags` は実装済みだが作成 UI が無く、全画面が空でユーザーがタグを増やせない。既存 endpoint のみ消費する作成 UI を追加。
3. **タグ系 IA の統合整理** — `タグ管理`(編集) と `タグカタログ`(ライフサイクル) は同じタグ定義テーブルを別画面で操作しており「どこで作るか分からない」混乱の元。**「タグ定義管理」1 画面に統合**（作成/編集/有効化/停止/完全削除）し、nav を `タグ定義` / `タグキュー` の 2 本へ整理。

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- 実装区分: **[実装区分: 実装仕様書]**（コード変更を伴う）
- visualEvidence: `VISUAL_ON_EXECUTION`
- Phase 12 strict 7: `outputs/phase-12/` に配置
- local verification: focused Vitest 7 files / 33 tests PASS、typecheck PASS、lint PASS、design-token gate PASS、apps/api diff empty
- Phase 13: browser/staging visual evidence、commit / push / PR は user-gated
- SSOT: [`_shared-context.md`](./_shared-context.md)（全 Phase の正本）

- staging URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/tags/catalog`
- 観測症状（2026-06-09）: カタログでエラーバウンダリ「管理画面を表示できませんでした」。タグ管理は 0 件表示で新規作成導線なし。
- 注: console の `[Sentry] You cannot use Sentry.init() in a browser extension` はブラウザ拡張由来ノイズで対象外。

## ユーザー意思決定（確定済み）

| 設問 | 決定 |
|------|------|
| IA 統合の深さ | タグ管理＋カタログを 1 画面「タグ定義管理」に統合。nav は タグ定義 / タグキュー の 2 本。 |
| 停止中タグの既定表示 | 既定は有効タグのみ＋トグルで停止中表示。 |

## スコープ（3 タスク lane）

| Lane | 対象 | 区分 | 状態 | 仕様書 |
|------|------|------|------|--------|
| A | カタログクラッシュ修正 + 統合データ層（`tagDefinitionView` 正規化 adapter・`active` 含む shape・`items ?? []` 防御） | 実装仕様書 | implemented local | `tasks/task-a-catalog-crash-fix-and-data-layer.md` |
| B | 新規タグ作成 UI + 配線（既存 `POST /api/admin/tags` 消費・`createTag()` web api fn・作成フォーム） | 実装仕様書 | implemented local | `tasks/task-b-tag-create-ui.md` |
| C | IA 統合（`TagDefinitionPanel`・nav 整理・catalog redirect・CSS/視覚整理） | 実装仕様書 | implemented local | `tasks/task-c-tag-definition-consolidation.md` |

> 全 lane は **1 サイクル / 1 PR で完了する**スコープに設計（CONST_007）。先送り・別 PR・バックログ送りなし。

## 実装区分

- 3 lane すべて **[実装区分: 実装仕様書]**。コード変更を伴う。各 lane の `## DoD` に CONST_005 必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト方針・ローカル実行コマンド・DoD）を完備。
- 判定根拠: クラッシュ修正・作成機能追加・パネル統合・nav 変更はすべてコード変更なしで達成不可能（docs-only 不成立）。

## 不変条件（全 lane 共通）

1. **既存 API のみ接続**: `apps/api/src/routes/admin/tags.ts` の現行 endpoint surface のみ消費。新 endpoint 追加・D1 schema 変更・API レスポンス shape 変更は禁止。
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を触らない。
3. **OKLch トークン正本化**: 色は `tokens.css` の `var(--ubm-*)` 経由のみ。HEX 直書き禁止（CI gate `verify-design-tokens`）。
4. **プロトタイプ primitives 準拠**: 既存 primitive（Button/Card/Chip/Input/FormField/EmptyState/ConfirmDialog）を再利用。新規 primitive を生やさない。
5. **admin form input は FormField 経由**（CLAUDE.md 不変条件 #9）。
6. **admin mutation は `@/features/admin/hooks/useAdminMutation` 経由**（CLAUDE.md 不変条件 #10）。
7. **テストは `*.spec.{ts,tsx}` のみ**（`*.test.*` 禁止）。
8. **API 乖離は UI adapter で吸収**（API 非変更）。
9. **タグキュー（`/admin/tags`）は統合対象外**（別ドメイン・挙動不変）。

## Phase 構成

| Phase | ファイル | 内容 |
|-------|---------|------|
| 1 | `phase-1-requirements.md` | 3 課題の症状・真因・AC・既存命名規約・inventory |
| 2 | `phase-2-design.md` | 統合パネル設計・データ adapter・作成フロー・nav/redirect 設計・state ownership |
| 3 | `phase-3-design-review.md` | 不変条件適合・既存資産衝突マトリクス・4 条件 |
| 4 | `phase-4-test-plan.md` | Vitest / grep gate / 防御正規化テストの計画 |
| 5 | `phase-5-implementation.md` + `tasks/task-a..c.md` | 各 lane の実装仕様（CONST_005 完備） |
| 6 | `phase-6-test-additions.md` | 失敗パス・回帰 guard・補助テスト |
| 7 | `phase-7-coverage.md` | coverage / 変更行保護 |
| 8 | `phase-8-refactor.md` | 旧パネル吸収・重複排除・破棄判断 |
| 9 | `phase-9-qa.md` | 品質保証 gate（削除確認含む） |
| 10 | `phase-10-final-review.md` | 30 種思考法 compact + 4 条件 + blocker 判定 |
| 11 | `outputs/phase-11/manual-test-result.md` | runtime pending 境界 |
| 12 | `outputs/phase-12/*` | strict 7 |
| 13 | `outputs/phase-13/pr-creation-result.md` | user-gated PR 境界 |

## 並列実行戦略

- **直列前提**: Lane A（データ shape 確定）→ Lane C（統合）。
- **並列可能**: Lane A と Lane B（作成 api fn）は独立に並列実装可。
- **最後**: Lane C は A+B の surface 確定後に統合（パネル・nav・redirect・CSS）。

## 参照

- `apps/web/app/(admin)/admin/tag-master/page.tsx` / `tags/catalog/page.tsx` / `tags/page.tsx`
- `apps/web/src/components/admin/TagCatalogPanel.tsx` / `TagCatalogRow.tsx` / `tagCatalogLifecycle.ts`
- `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` / `TagMasterEditForm.tsx`
- `apps/web/src/features/admin/api/tags.ts` / `members.ts`
- `apps/web/src/components/shell/shell-config.ts`
- `apps/web/app/api/admin/[...path]/route.ts`（web proxy）
- `apps/api/src/routes/admin/tags.ts`（API surface・**変更しない**）
- `apps/web/src/styles/globals.css` / `tokens.css`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/claude-design-prototype/`
