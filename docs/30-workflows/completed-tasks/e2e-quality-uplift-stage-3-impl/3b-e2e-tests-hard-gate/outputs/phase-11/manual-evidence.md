# Phase 11 — 手動テスト / Evidence (NON_VISUAL)

## 視覚的 evidence

`visualEvidence: NON_VISUAL`（`index.md` 機械検証メタ情報）。スクリーンショット不要。

## ローカル手動 evidence

```
# fixture 単体（PASS）
$ THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/pass bash scripts/coverage-gate-e2e.sh
::notice::line coverage 85.0 >= 80
exit=0

# fixture 単体（79.99% FAIL 再現 — AC-02 の根拠）
$ THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/fail-79 bash scripts/coverage-gate-e2e.sh
::error::line coverage 79.99 < 80
exit=1

# fixture 単体（不在）
$ THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/missing bash scripts/coverage-gate-e2e.sh
::error::coverage-summary.json not found at scripts/__tests__/coverage-gate-e2e.fixture/missing/coverage-summary.json
exit=1
```

## CI runtime evidence（PR 作成後 補完）

| 取得項目 | コマンド |
|----------|----------|
| PR 上 job 起動 | `gh run list --workflow=e2e-tests.yml --branch=feat/e2e-coverage-gate` |
| coverage artifact | `gh run download <run-id> --name e2e-coverage-<sha>` |
| monocart artifact | `gh run download <run-id> --name e2e-monocart-<sha>` |
| failure HTML report | `gh run download <run-id> --name e2e-html-report-<sha>` |
| context 名登録 | `gh api repos/daishiman/UBM-Hyogo/commits/<sha>/check-runs \| jq -r '.check_runs[].name'` |
