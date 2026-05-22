# Phase 1: 要件定義 / GO 判定

## 目的

本タスク着手の前提条件である **`audit-correlation-verify.yml` の main 上 empirical green** を確認し、required 登録 GO/NO-GO を決定する。

## 入力

- `.github/workflows/audit-correlation-verify.yml`
- `gh run list --workflow=audit-correlation-verify.yml --branch=main`
- 起票元 unassigned spec: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02-branch-protection-required-check.md`
- 親タスク Phase 12: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/outputs/phase-12/unassigned-task-detection.md`

## 実装手順

1. 親タスク完了状態の確認:
   ```bash
   gh issue view 516 --json state,closedAt
   gh api repos/daishiman/UBM-Hyogo/contents/.github/workflows/audit-correlation-verify.yml --jq .name
   ```
2. main 上の empirical green 件数確認:
   ```bash
   gh run list \
     --workflow=audit-correlation-verify.yml \
     --branch=main \
     --status=success \
     --limit=5 \
     --json databaseId,headSha,createdAt,conclusion
   ```
3. 直近 1 件以上 success が無い場合は **NO-GO** とし、Phase 11 へ「main green 待ち」記録のみ残して Phase 2 以降の実装を停止する。
4. GO 判定:
   - 直近 7 日以内に success 1 件以上、かつ failure run 連続 0 件
   - main 直近 commit を流した run（または main へのマージで自動起動した run）が success
5. GO/NO-GO 判定根拠を `outputs/phase-1/phase-1.md` に記録（run id / SHA / created_at / conclusion を貼り付け）。

## DoD（Phase 1）

- [ ] `outputs/phase-1/phase-1.md` に GO/NO-GO の根拠と `gh run list` 出力スニペットが記録されている
- [ ] NO-GO 時は Phase 2-10 の実装着手を停止し、`workflow_state` を `blocked_runtime_evidence_pending` に記録

## 苦戦予測

- 親タスク #516 で workflow を merge した直後は、main 上で自動起動した初回 run が flaky に fail する可能性がある。fail を 1 度でも観測している場合は、追加 commit / 手動 dispatch で再 run し、安定化を確認してから GO とする。
