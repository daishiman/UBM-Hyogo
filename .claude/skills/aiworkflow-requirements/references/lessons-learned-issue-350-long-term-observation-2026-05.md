---
topic: lessons-learned-issue-350-long-term-observation
applies_to: operations
related_workflows:
  - issue-350-long-term-production-observation
  - 09c-serial-production-deploy-and-post-release-verification
related_reference: references/post-release-long-term-observation.md
last_updated: 2026-05-06
---

# Lessons Learned — Issue #350 Long-term Production Observation (2026-05)

## 苦戦箇所サマリ

長期本番観測（D+7 / D+30）を Cloudflare Workers cron で実装しようとしたが無料枠 3 本が既に埋まっており、GitHub Actions schedule + workflow_dispatch + reminder Issue 自動起票へ設計を切り替えた。reminder 重複起票・PII 境界・consumed trace 接続で複数の落とし穴があり、本ドキュメントに記録する。

## 1. Cloudflare cron 無料枠制約

- 症状: D+7 / D+30 用 cron を追加しようとしたが Cloudflare Workers の cron triggers 無料枠 3 本が `09c` 系ですでに埋まっていた。
- 対処: GitHub Actions の `schedule` + `workflow_dispatch` に切り替え、`.github/workflows/post-release-observation-reminder.yml` で reminder Issue を起票する構成に変更。
- 教訓: cron 系の追加要件は Cloudflare 制約を最初にチェックし、超過時は GitHub Actions schedule を第一候補にする。
- 参照: `references/deployment-cloudflare.md`、`.github/workflows/post-release-observation-reminder.yml`

## 2. Reminder Issue の重複起票

- 症状: `schedule` と手動 `workflow_dispatch` が両方走ると同じ release に対して reminder Issue が複数立つ可能性があった。
- 対処: release tag を idempotency key として `gh issue list --search` で既存 issue を確認してから create する `scripts/observation/create-reminder-issue.sh` を導入。
- 教訓: 自動 issue 起票は必ず idempotency key（release tag / commit sha 等）で先行検索してから create する。
- 参照: `scripts/observation/create-reminder-issue.sh`

## 3. PII / Evidence Boundary

- 症状: 観測 evidence にどのデータを保存してよいか、運用開始前に明文化されていなかった。
- 対処: 「保存可」aggregate metrics / redacted CSV / GitHub run id / 判定コメント、「保存禁止」URL query / request/response body / IP / User-Agent / email / member ID / session token / Cloudflare/GitHub token、として `references/post-release-long-term-observation.md` の Evidence Boundary に明記。
- 教訓: 観測系タスクは runbook 着手前に PII 境界を明文化する。aggregate と raw を必ず分離する。
- 参照: `references/post-release-long-term-observation.md`、`docs/runbooks/post-release-long-term-observation.md`

## 4. 09c → Issue #350 Consumed Trace の同時更新

- 症状: 09c Phase 12 の long-term observation 行を Issue #350 として昇格させる際、`completed-tasks/09c-A-production-deploy-execution/outputs/phase-12/main.md` / `unassigned-task-detection.md`、`completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` / `phase-12.md`、`unassigned-task/task-09c-long-term-production-observation-001.md` の 5 ファイル同時更新が必要で、整合させるのが煩雑だった。
- 対処: `consumed_by_issue_350` ステータスと昇格先 path（`docs/30-workflows/issue-350-long-term-production-observation/`）を 5 ファイル全てに記載し対称性を維持。
- 教訓: unassigned-task → 正式 Issue 昇格時は consumed trace を 09c 完了タスク側 / unassigned-task 側 / 新 workflow 側の 3 軸全てに残す。
- 参照: `docs/30-workflows/completed-tasks/09c-*/outputs/phase-12/`

## 5. Workflow Dispatch と Schedule の二重トリガ

- 症状: `workflow_dispatch` で手動再走行する場合と `schedule` 自動起動の両方で同じ Issue が立つリスク。
- 対処: idempotency 条件は #2 と同じ。reminder template に release tag を必ず含めて検索キーにする。
- 教訓: workflow が複数トリガを持つ場合、副作用（issue create / comment / commit）には必ず idempotency 設計を入れる。

## Follow-up

- `ut-350-fu-01-ci-actionlint-shellcheck-gate` — actionlint / shellcheck CI gate を追加
- `ut-350-fu-02-post-merge-runtime-evidence` — マージ後 runtime evidence 取得手順整備
