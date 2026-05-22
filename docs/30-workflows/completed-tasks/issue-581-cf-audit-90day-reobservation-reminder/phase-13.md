# Phase 13: user approval / closed issue handling

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 13 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

Phase 11/12 の成果物を user に提示し、commit / push / PR 作成と 2026-08-05 以後の runtime 再観測実行の **user 承認** を得る。承認なしに git mutation や production / GitHub runtime operation を実施しない（CONST_002）。

## user approval gate

実行者は以下を user に提示する:

1. `outputs/phase-11/gate-decision.md` の Status と decision
2. `outputs/phase-12/system-spec-update-summary.md` の予定差分
3. `outputs/phase-12/unassigned-task-detection.md` の後続未タスク要否
4. 想定 commit / PR 範囲（`docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/` と aiworkflow-requirements 同期分）

user 承認後にのみ:

- `git add` で本 workflow ディレクトリ、既存 reminder pointer、aiworkflow-requirements 同期分（references / indexes / changelog / LOGS）を stage する
- `git commit -m "docs: issue-581 90day re-observation cycle results (Refs #581 #546)"` で commit
- 必要なら `gh pr create --base dev` で PR 作成
- `pnpm indexes:rebuild` 実行済み差分の確認

## closed issue handling（厳守）

| 項目 | 取り扱い |
| --- | --- |
| Issue #581 | CLOSED 維持。reopen / state 操作 **禁止** |
| Issue #546 | 同上 |
| commit message | `Refs #581` `Refs #546` のみ。`Closes` `Fixes` `Resolves` 禁止 |
| PR title | `docs: issue-581 90day re-observation ...`（issue ID は本文 `Refs` で参照） |
| PR body | Gate 判定結果、後続未タスク要否、aiworkflow-requirements 同期内容 |

## blocked actions（user 承認なしには実行禁止）

- `git commit`
- `git push`
- `gh pr create`
- `gh issue edit / reopen / close`
- `bash scripts/cf.sh d1 migrations apply`
- workflow dispatch / Cloudflare deploy

## early termination handling

Phase 5 で前提条件が未充足だった場合、Phase 13 では以下のみ user に提示する:

1. `outputs/phase-11/precondition-check.md`
2. 次回再評価日（`outputs/phase-12/unassigned-task-detection.md` と `outputs/phase-12/main.md`）
3. `unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md` の reminder 更新差分

commit / PR は user 承認後にのみ実施。

## 完了条件

- [ ] user 承認証跡（チャットログ等）が残っている
- [ ] Issue #581 / #546 が CLOSED のままである
- [ ] commit message に `Refs #581 #546` のみが含まれ `Closes` 等が含まれない
- [ ] aiworkflow-requirements 同期と indexes 再生成が仕様作成 cycle 内で完了している

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase13-detail.md`
- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-13.md`
