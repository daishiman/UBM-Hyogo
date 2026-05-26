# Phase 12 — ドキュメント同期 (canonical 9 headings)

## 1. main.md — 概要

本タスクは Issue #895 を受けて、`AdminTopbar` の `actions` slot に admin グローバル操作 client island `AdminTopbarActions` を流し込む。`(admin)/layout.tsx` の Server Component 境界を維持しながら、ログアウト導線を topbar に集約する。

## 2. implementation-guide.md — 実装ガイド

Phase 5-6 を参照。3 ファイル変更で完結:
- 新規: `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx`
- 新規: `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx`
- 編集: `apps/web/app/(admin)/layout.tsx`

## 3. system-spec-update-summary — システム仕様更新

| 仕様 | 更新内容 |
|------|---------|
| `docs/00-getting-started-manual/specs/` | 直接の更新なし（admin layout の DOM 契約は維持） |
| `CLAUDE.md` | 更新なし |
| `.claude/skills/aiworkflow-requirements/` | quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS に Issue #895 と topbar actions 責務境界を同期 |

## 4. documentation-changelog — ドキュメント変更履歴

- `docs/30-workflows/issue-895-admin-topbar-actions-client-island/` を新規作成（Phase 1-13 + artifacts.json）
- `docs/30-workflows/completed-tasks/parallel-03-followup-004-admin-topbar-actions-buttons.md` へ source one-pager を移動し consumed trace を追記

## 5. unassigned-task-detection — 未割当タスク検出

Phase 12 strict check で `outputs/phase-12/unassigned-task-detection.md` を生成。新規派生タスク候補:

| 候補 | 判定 |
|------|------|
| 通知ベル UI（既存 API がない） | 別タスク化（既存 endpoint surface 不足のため本タスクスコープ外） |
| ユーザーメニュー（プロファイル / 設定リンク） | 別タスク化（MVP では不要） |
| visual baseline 更新 | 既存 visual smoke 対象に admin topbar が含まれる場合のみ自動更新ジョブで実施 |

明示的に新規 unassigned-task を作成する候補は **0 件**。既存 source one-pager は consumed 化済み。

## 6. skill-feedback-report — スキル反映

- task-specification-creator のテンプレ更新は不要（既存 Phase 12 同期ルールで吸収可能）。
- `.claude/skills/aiworkflow-requirements/` の admin AppShell トピックに「topbar actions = グローバル / page header actions = ページ固有」の責務境界を同期済み。

## 7. phase12-task-spec-compliance-check — Phase 12 compliance

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証:
- canonical 9 headings 全項目記載
- artifacts.json gate metadata 正常
- evidence_path が outputs/ 配下に実在
- workflow root scan で stale 参照 0

## 8. evidence inventory

`outputs/phase-11/manual-test-result.md` を追加済み。NON_VISUAL かつ DOM/axe/focused specs で確認できる変更のためスクリーンショットは不要。

## 9. governance / followup

本タスク完了後:
- 親 followup-001 完了ディレクトリにクロスリンク追加（任意）
- source one-pager completed-tasks 移動: 完了
- stale 参照 `rg "parallel-03-followup-004|issue-895-admin-topbar"`: Phase 12 evidence に記録
- `pnpm indexes:rebuild`: 未実行（手動 index パッチで必要箇所を同期）
