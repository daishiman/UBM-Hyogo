# Phase 11: NON_VISUAL local evidence

> 本サイクルで実コード・CI workflow・focused test を実装し、NON_VISUAL local evidence を物理ログとして保存した。GitHub Actions runtime evidence は PR 作成後の user-gated 境界に残す。

## 11.1 local evidence

| classification | path | status |
| --- | --- | --- |
| lint script log | `outputs/phase-11/evidence/lint-coverage-threshold.log` | present |
| focused vitest log | `outputs/phase-11/evidence/vitest-coverage-threshold-lint.log` | present |

この 2 行を `outputs/phase-12/phase12-task-spec-compliance-check.md` の `Phase 11 evidence file inventory` セクションに転記する。

## 11.2 local commands

| Command | Result |
| --- | --- | --- |
| `pnpm lint:coverage-threshold` | exit 0 / `coverage-threshold-lint: OK (sources=2, threshold=80)` |
| `pnpm exec vitest run scripts/__tests__/coverage-threshold-lint.spec.ts` | exit 0 / 8 tests passed |

## 11.3 user-gated runtime evidence

PR 作成後に CI 上で job が緑になったら次を追加する。

| classification | path | status |
| --- | --- | --- |
| CI job log | `outputs/phase-11/evidence/ci-coverage-threshold-lint.log` | pending_user_approval |

## 11.4 本サイクルでの取り扱い

| 項目 | 状態 |
| --- | --- |
| `outputs/phase-11/` ディレクトリ作成 | 済み |
| focused local evidence | 済み |
| screenshot / axe / video | NON_VISUAL のため不要 |
| Phase 11 evidence inventory | local present 2 行 + CI pending 1 行を Phase 12 compliance check に記載 |

これは `phase12-compliance-check-template.md` の NON_VISUAL evidence inventory と、CI runtime user-gated boundary の分離に合致する。
