# Phase 13: PR 作成 — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ] / CONST_004 例外根拠: 本タスクは `taskType: docs-only / NON_VISUAL / spec_created`。Phase 13 PR は **仕様書作成 PR** であり、コード変更を含まない。実 secret 投入 / 実 deploy / 実 smoke は user approval 経由の後続 runtime wave で別 PR として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 13 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 目的

仕様書作成タスクの PR 作成手順を仕様化する。本仕様書作成タスクでは PR の commit / push / 作成は **実行しない**。user approval gate G-05 通過後に別 wave で実行する。

## 入力

- Phase 1〜12 全成果物
- `.claude/commands/ai/diff-to-pr.md`（PR body 仕様）
- `outputs/phase-12/implementation-guide.md`（PR body の主たるソース）

## 実行タスク

### Task 13-1: branch 名規約

- 既定 branch 名: `docs/09b-A-observability-sentry-slack-runtime-smoke-task-spec`
- 代替（実装着手時）: `feat/09b-A-observability-sentry-slack-runtime-smoke-task-spec`
- 完了条件: branch 名 candidate が PR template に記載される

### Task 13-2: PR title 規約

- 既定 title: `docs(09b-A): observability sentry slack runtime smoke task spec`
- 70 文字以内
- 完了条件: title が `outputs/phase-13/main.md` に記録

### Task 13-3: PR body フォーマット

- セクション構成（順序固定）:
  1. **Summary**: 1〜3 bullet（仕様書作成範囲 / runtime wave 分離契約 / aiworkflow-requirements 同期）
  2. **Context**: 09b 親タスクとの関係 / 09c blocker reference / Phase 1〜3 GO 判定リンク
  3. **Files Changed**: `git diff main...HEAD --name-only` 出力
  4. **後続 wave のリンク**: runtime execution wave 候補 task 名 / approval gate G-04 / G-05 通過条件
  5. **Test Plan = docs-only validation**: grep gate 3 系統 / `pnpm typecheck` / `pnpm lint` / indexes rebuild drift 0 / Phase 12 compliance check PASS
- 完了条件: 上記 5 セクションが template として確定

### Task 13-4: PR 作成前 self-check（commit 直前）

- [ ] grep gate 3 系統が 0 hit（DSN URL / webhook URL / sentry.io project id）
- [ ] `outputs/phase-11/main.md` に 7 evidence template が存在
- [ ] `outputs/phase-12/` 配下に 7 必須ファイルが実体存在
- [ ] aiworkflow-requirements 2 reference の diff が `system-spec-update-summary.md` と整合
- [ ] `mise exec -- pnpm indexes:rebuild` 後に `git status` で drift 0
- [ ] workflow root `state` が `spec_created` のまま
- [ ] 実 secret 値 / 実 DSN / 実 webhook が PR body に含まれていない

### Task 13-5: 承認 gate G-05（PR 作成許可）

- 条件: Task 13-4 self-check が全 PASS かつ user approval が得られていること
- 自走禁止: `git commit` / `git push` / `gh pr create` は本仕様書作成タスクで実行しない
- 完了条件: G-05 通過記録が `outputs/phase-13/main.md` に template として用意されている


## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-13/main.md`

## 完了条件（本仕様書作成段階）

- `outputs/phase-13/main.md` が存在し、PR title / body / branch / self-check / G-05 template が網羅されている
- 本タスクで `git commit` / `git push` / `gh pr create` を**実行しない**

## 自走禁止操作（再掲）

- `git commit` / `git push` / `gh pr create` のいずれも本仕様書作成タスクで実行しない
- 実行は user approval（G-05）経由の別 wave で行う

## 次工程

PR 作成後、user approval を経て runtime execution wave（Phase 11 evidence 取得）に着手する。

## notes

本仕様書作成タスクの Phase 13 完了時点で、PR draft 作成準備が完了している状態（`outputs/phase-13/main.md` が PR template として完成）を最終 deliverable とする。
