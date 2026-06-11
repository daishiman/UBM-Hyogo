# Phase 13: commit / PR / release

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- workflow_state: `implemented_local_runtime_pending` → Phase 13 は `pending_user_approval`
- 本 Phase の状態: **BLOCKED（pending_user_approval）**。本タスクでは PR 未作成。

## 目的

実装完了後に commit / push / PR を作成し、`dev` ブランチへ変更を統合する。本 Phase は **ユーザーの明示承認後にのみ実行** する。implemented_local_runtime_pending 段階の本タスクでは、commit / push / PR / staging deploy / スクリーンショット取得は **一切実行しない**。

## ブロック理由

本 workflow は `implemented_local_runtime_pending` であり、`apps/web` 実装・focused Vitest・staging 視覚証跡は user-gated 境界を除きローカルで検証する。以下の前提がすべて揃い、かつユーザーが明示承認するまで Phase 13 の実行を禁止する。

| 前提条件 | 状態（本仕様作成時点） |
| --- | --- |
| AC-1..AC-10 実装完了（`apps/web` の TSX/TS/test） | 実装済み（staging 視覚証跡のみ user-gated） |
| focused vitest が green（dashboardGlossary + dashboard components + RecentActionsTable + AuditLogPanel） | PASS（7 files / 77 tests） |
| `pnpm typecheck && pnpm lint && pnpm verify:tokens` が green | PASS |
| `git diff --name-only -- apps/api` が空（AC-8） | PASS |
| Phase 11 staging スクリーンショット取得済み | `staging_visual_pending_user_gate`（user-gated） |

## user-gated 操作一覧

以下の操作は **すべてユーザーの明示承認が必要**。Claude Code が自律的に実行しない。

| 操作 | ゲート種別 |
| --- | --- |
| `git add` / `git commit` | user-gated |
| `git push origin feat/admin-dashboard-jp-clarity-and-card-ux` | user-gated |
| `gh pr create --base dev ...` | user-gated |
| staging deploy / 認証 / スクリーンショット取得 | user-gated |

## ブランチ・PR base

- **branch**: `feat/admin-dashboard-jp-clarity-and-card-ux`
- **PR base**: `dev`（CLAUDE.md PR flow に準拠。`feature/* --PR--> dev`。`main` への PR は production リリース時の `dev → main` のみ）

## 実行順序（承認後）

1. **ローカル品質確認**（全 green を確認してから commit）

   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm verify:tokens
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
     apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx \
     apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx \
     apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx \
     apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx \
     apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx \
     apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
   git diff --name-only -- apps/api  # 空であること（AC-8）
   ```

2. **コミット粒度**（4 単位）

   | # | 粒度 | 含むファイル例 |
   | --- | --- | --- |
   | 1 | spec（仕様書本体） | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-*.md` / `index.md` |
   | 2 | outputs（Phase 12 + unassigned-task-specs） | `outputs/phase-12/*.md` / `unassigned-task-specs/admin-audit-page-jp-action-labels.md` |
   | 3 | impl（apps/web 実装 + test） | `apps/web/src/lib/admin/dashboardGlossary.ts`（新規）/ `apps/web/src/features/admin/components/_dashboard/**` / `__tests__/*.spec.ts(x)` |
   | 4 | Phase 11 visual evidence | `outputs/phase-11/screenshots/*.png` / `outputs/phase-11/manual-test-result.md` |

3. **PR 作成**

   - **PR タイトル案**: `feat(web/admin): 管理ダッシュボードの日本語化＋直近のアクション/公開ステータスのカード型UI是正`
   - **PR 本文構成案**:

   ```
   ## 変更概要

   - KPI 4 枚のラベルを日本語化（会員総数 / サイト公開中 / タグ未設定 / 要対応のフォーム項目）+ uppercase 撤廃（AC-1）
   - SchemaAlertCard の技術語（スキーマ/alias/schema）を非エンジニア向けに平易化（AC-2）
   - ZoneDistribution の eyebrow を「会員分布」へ日本語化（AC-3）
   - 直近のアクションをテーブル→カード型アクティビティリストへ再設計。アクション/targetType を日本語化し対象 ID を truncation でカード内に収める（AC-4）
   - 公開ステータスを 600px 固定 SVG 縦棒→コンパクト横バーリストへ再設計（AC-5）
   - 用語 SSOT `dashboardGlossary.ts` を新設し KPI/アクション/targetType/ステータスのラベルを一元管理・未登録は raw fallback（AC-6）
   - 色は OKLch トークンのみ・HEX 直書き 0 件（AC-7）
   - apps/api / D1 / Google Form 非変更（AC-8）

   ## AC 対応

   | AC | 内容 | 状態 |
   | --- | --- | --- |
   | AC-1..AC-3 | KPI/技術語/eyebrow 日本語化 | ✅ |
   | AC-4 | 直近のアクション カード化・truncation | ✅ |
   | AC-5 | 公開ステータス 横バー化 | ✅ |
   | AC-6 | dashboardGlossary SSOT 新設 | ✅ |
   | AC-7 | トークン厳守（verify:tokens green） | ✅ |
   | AC-8 | API 非変更（git diff -- apps/api 空） | ✅ |
   | AC-9 | 既存テスト契約維持（aria-label / audit リンク / axe） | ✅ |
   | AC-10 | focused vitest green | ✅ |

   ## 変更ファイル（新規 5 / 編集 8）

   - 新規: apps/web/src/lib/admin/dashboardGlossary.ts ＋ 新規 spec
   - 編集: KpiGrid.tsx / KpiCard.tsx / SchemaAlertCard.tsx / ZoneDistribution.tsx / RecentActionsTable.tsx / StatusDistribution.tsx ＋ 既存 spec 更新

   ## スクリーンショット参照

   - outputs/phase-11/screenshots/admin-dashboard-desktop.png（KPI 日本語・技術語排除）
   - outputs/phase-11/screenshots/recent-actions-card-list.png（カード型・truncation）
   - outputs/phase-11/screenshots/status-distribution-bars.png（コンパクト横バー）
   - outputs/phase-11/screenshots/admin-dashboard-narrow-mobile.png（モバイル幅 縦積み）
   > staging 認証済み環境で取得（user-gated）。取得後に PR へ参照を追記する。

   ## 検証コマンド結果

   - pnpm typecheck: exit 0
   - pnpm lint: exit 0
   - pnpm verify:tokens: green
   - focused vitest（dashboardGlossary + dashboard components + RecentActionsTable + AuditLogPanel）: 7 files / 77 tests PASS
   - git diff --name-only -- apps/api: 空

   ## same-cycle follow-up

   - RES-1: /admin/audit への glossary 適用 → same-cycle resolved（trace: unassigned-task-specs/admin-audit-page-jp-action-labels.md）

   ## 参照

   - task_id: admin-dashboard-jp-clarity-and-card-ux
   - 実装仕様: docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/
   ```

   ```bash
   gh pr create --base dev \
     --title "feat(web/admin): 管理ダッシュボードの日本語化＋直近のアクション/公開ステータスのカード型UI是正" \
     --body "<上記本文>"
   ```

> スクリーンショットが未取得の場合は、PR 本文のスクリーンショット参照は取得後に追記する。画像がない段階でスクリーンショット専用セクションに空の参照を残さない。

## 成果物

- 本ファイル（PR 作成手順）: user-gated 操作一覧、ブランチ/PR base、承認後の実行順序、PR タイトル/本文構成案。本タスクでは PR 未作成（implemented_local_runtime_pending）。

## 完了条件

- [ ] 本タスクでは PR 未作成であることを明記した（implemented_local_runtime_pending・user-gated）。
- [ ] PR base が `dev`・branch が `feat/admin-dashboard-jp-clarity-and-card-ux` で確定している。
- [ ] commit / push / PR / staging deploy / スクリーンショット取得がすべて user-gated として列挙されている。
- [ ] PR タイトル案・本文構成案（変更概要 / AC 対応 / スクショ参照 / 検証コマンド結果）が記載されている。
- [ ] 承認後の実行順序（品質確認 → コミット粒度 → PR 作成）が記載されている。

## 参照資料

| 種別 | Path |
| --- | --- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| QA | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-9-qa.md` |
| 最終レビュー | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-10-final-review.md` |
| Phase 11 手動テスト計画 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-11-manual-test.md` |
| RES-1 経緯 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/unassigned-task-specs/admin-audit-page-jp-action-labels.md` |
