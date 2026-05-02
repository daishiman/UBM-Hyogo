# documentation changelog

## 新規追加

### scripts
- `scripts/observability-target-diff.sh` (実装本体)
- `scripts/lib/redaction.sh` (redaction module)

### tests
- `tests/unit/redaction.test.sh`
- `tests/integration/observability-target-diff.test.sh`
- `tests/fixtures/observability/logpush-with-token.json`
- `tests/fixtures/observability/logpush-empty.json`
- `tests/fixtures/observability/api-error-403.json`
- `tests/fixtures/observability/sink-url-with-query.txt`
- `tests/golden/diff-mismatch.md`
- `tests/golden/usage.txt`

### docs (タスク仕様書 outputs)
- `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-{01..12}/`
  - phase-01/main.md
  - phase-02/{main, script-interface-design, redaction-rules, cf-sh-integration}.md
  - phase-03/main.md
  - phase-04/main.md
  - phase-05/{main, script-implementation}.md
  - phase-06/main.md
  - phase-07/{main, ac-matrix, coverage-report}.md
  - phase-08/main.md
  - phase-09/main.md
  - phase-10/{main, go-no-go, approval-record}.md
  - phase-11/{main, manual-run-log, diff-sample, redaction-verification, cf-sh-tail-cross-check}.md
  - phase-12/{main, implementation-guide, system-spec-update-summary, documentation-changelog, unassigned-task-detection, skill-feedback-report, phase12-task-spec-compliance-check}.md

### 親タスク runbook (AC-4 導線)
- `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/observability-diff-runbook.md`

## 変更

### scripts
- `scripts/cf.sh` — `observability-diff` / `api-get` の 2 サブコマンドを追加
  - `observability-diff`: `scripts/with-env.sh` + `mise exec` 経由で `scripts/observability-target-diff.sh` に exec する運用入口
  - `api-get`: `/client/v4/...` パスのみ allowlist した read-only curl ラッパー (Logpush 等で必要な REST GET を `cf.sh` 入口に統一)
  - usage 行に `observability-diff --current-worker ... --legacy-worker ...` 例を追記

### docs (親タスク runbook 追記)
- `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/observability-diff-runbook.md`
  - 親タスク完了後に本 script への導線 (AC-4) を追記。`bash scripts/cf.sh observability-diff ...` を公開入口として明示。

## 削除
なし
