# Phase 1 — 要件定義 / root cause 確定

## 目的

親 #586 の D+7 集計失敗を確認し、recovery 2 周目を起動するための root cause を分類確定する。

## 入力

- `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/hourly-run-7day-summary.json`（存在する場合。存在しない場合は missing 自体を evidence として扱う）
- `gh run list --workflow=cf-audit-log-monitor.yml --limit 200 --json conclusion,createdAt,databaseId,htmlUrl,headBranch`（2026-05-10 merge 以降の全 hourly run）
- 2026-05-14 時点での観測: 2026-05-13 23:32 UTC 以降の hourly run が全件 `failure` (job 2 秒で startup_failure)

## 実行手順

1. 親 #586 の D+7 summary JSON が存在しない場合は `recovery-rootcause-helper.ts --since 2026-05-10T11:48:23Z --mark-missing-parent-summary` で代替 stub を生成し、`parent_summary_json: missing` を記録する
2. `gh run list` 出力を `outputs/phase-11/evidence/hourly-run-1st-cycle-listing.json` に保存（read-only evidence）
3. failure run のうち 1 件を選び `gh api repos/daishiman/UBM-Hyogo/actions/runs/<id>/jobs` を取得し root cause 候補を特定する
4. root cause を以下 4 分類のいずれかに確定:
   - `infrastructure`: GitHub Actions runner / artifact infra 障害（再観測のみで解決可能）
   - `production-code`: workflow YAML / scripts / secrets 不整合（修正 PR が必要）
   - `configuration`: GitHub Variables / Secrets 設定漏れ（gh CLI で訂正のみ）
   - `unknown`: 上記に該当しない（escalation）
5. `outputs/phase-11/evidence/recovery-rootcause.md` に分類結果 + 根拠 (run URL + job log 抜粋) を記載

## 出力

- `outputs/phase-11/evidence/hourly-run-1st-cycle-listing.json`
- `outputs/phase-11/evidence/recovery-rootcause.md`

## 完了条件

- [ ] root cause が 4 分類のいずれかに確定している
- [ ] `production-code` 分類の場合、具体的な修正対象ファイルと修正方針が記載されている
- [ ] D'+0 候補時刻（root cause 修正 merge 後の次 hourly schedule 開始時刻 UTC）が決定されている
