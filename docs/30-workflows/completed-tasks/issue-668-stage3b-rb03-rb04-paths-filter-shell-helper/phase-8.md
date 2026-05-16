# Phase 8: CI 検証計画

CI runtime evidence は push / PR 作成後に取得するため user-gated。

## CI8 Matrix

| ID | PR 種別 | 期待 |
| --- | --- | --- |
| CI8-A | docs-only PR | `precheck.run_e2e=false`; e2e matrix skipped; `e2e-tests-coverage-gate` pass |
| CI8-B | code PR (`apps/web/**`) | `precheck.run_e2e=true`; e2e matrix run; `e2e-tests-coverage-gate` pass |
| CI8-C | mixed PR (`apps/web/**` + `docs/**`) | `precheck.run_e2e=true`; duplicate required context なし |
| CI8-D | shell-only PR (`scripts/lib/**`) | e2e workflow and `lint-shell.yml` both run |
| CI8-E | workflow-only PR (`.github/workflows/lint-shell.yml`) | e2e workflow no-op success; `lint-shell.yml` run |

## Evidence Paths

```
outputs/phase-11/evidence/ci/
  ci8a-docs-only-pr-checks.txt
  ci8b-code-pr-checks.txt
  ci8c-mixed-pr-checks.txt
  ci8d-shell-pr-checks.txt
  ci8e-workflow-pr-checks.txt
```

## Troubleshooting

| 症状 | 原因 | 対応 |
| --- | --- | --- |
| docs-only PR で required check pending | `e2e-tests-coverage-gate` の no-op branch が失敗 | `needs.precheck.outputs.run_e2e != true` の早期 exit を確認 |
| mixed PR で duplicate context | 旧 `e2e-tests-skip.yml` が残っている | skip workflow を削除 |
| code PR で e2e が走らない | precheck allowlist 漏れ | grep pattern を更新 |

## 完了条件

- [x] CI8-A〜CI8-E の期待値を single-workflow precheck 方式へ更新
- [ ] 実 PR runtime evidence は user approval 後に取得
