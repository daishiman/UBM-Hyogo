# Phase 8: 静的検査

[実装区分: 実装仕様書]

## 静的検査項目

| # | 項目 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| S1 | actionlint 全件 | `./actionlint -color .github/workflows/*.yml` | exit 0 |
| S2 | YAML syntax | actionlint 内部 parser で代替 | exit 0 |
| S3 | shellcheck | `shellcheck scripts/observation/*.sh scripts/observation/test/*.sh scripts/redaction-check.sh scripts/__tests__/*.sh` | exit 0（既存） |
| S4 | glob hit 件数 | `ls .github/workflows/*.yml \| wc -l` | 32 以上 |
| S5 | self-lint 残置 | `rg -c "actionlint" .github/workflows/verify-gate-metadata.yml .github/workflows/audit-correlation-verify.yml` | 各 >= 1 |
| S6 | runbook 配置 | `test -f docs/30-workflows/runbooks/workflow-lint-local-recovery.md` | exit 0 |
| S7 | yamllint decision | `test -f docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-02/yamllint-decision.md` | exit 0 |

## 実行ログ保存先

`outputs/phase-08/static-check-log.md`
