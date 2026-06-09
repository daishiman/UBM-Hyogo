# Phase 7: カバレッジ確認 — cf-token-env-contract-and-rotation-retirement

## 目的

本ワークフローで追加・変更したコードに限定してカバレッジを測定し、drift gate（A3）の pure function が line / branch 100% でテストされている証跡を残す。測定対象を「新 verifier の変更行」に限定し、リポジトリ全体や無関係ファイルを巻き込まないことを明示する（Feedback BEFORE-QUIT-002 / Feedback 5）。YAML / shell は coverage 計測の対象外であり、`actionlint` / `bash -n` で別途担保することを明記する。

## カバレッジ対象範囲（限定明示）

| 対象 | 計測 | 目標 | 担保手段 |
| ---- | ---- | ---- | ---- |
| `scripts/smoke/verify-runtime-smoke-secret-contract.mts` の pure function 群（`extractWorkflowSecrets` / `extractProvisionedSecrets` / `detectSecretContractViolations`） | あり（Vitest coverage） | line 100% / branch 100% | TC-1..TC-5（Phase 4）+ TC-E01..TC-E10 / RG-1（Phase 6） |
| `scripts/smoke/verify-runtime-smoke-secret-contract.mts` の `main()` / entry guard | 限定（I/O 副作用・process.exit を含むため line 到達を smoke で確認） | line 到達確認（branch 100% は必須としない） | RG-2 実ファイル統合実行（`tsx` 実走で main 経路を踏む） |
| `.github/workflows/runtime-smoke-staging.yml`（A2 degrade） | なし（coverage 計測外） | — | `actionlint` + 手動 trace（M-1..M-5 / RG-4） |
| `.github/workflows/verify-runtime-smoke-secret-contract.yml`（A5） | なし（coverage 計測外） | — | `actionlint` |
| `scripts/smoke/provision-staging-secrets.sh`（A1） | なし（coverage 計測外） | — | `bash -n` + RG-2 統合（実ファイル突合で provisioned 抽出が効くことを確認） |

> 測定は変更行（A3 の新規 pure function）に限定する。`pnpm typecheck` / `pnpm lint` が通る既存ファイルへ波及するカバレッジ低下を本フェーズの判定対象にしない（無関係コードを巻き込まない）。

## カバレッジ測定手順

| # | コマンド | 取得する証跡 |
| --- | ------ | ---- |
| 1 | `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts --coverage` | A3 pure function の line / branch カバレッジ実測値 |
| 2 | カバレッジレポートから対象ファイル行を抽出 | `verify-runtime-smoke-secret-contract.mts` の `% Lines` / `% Branch` 実測値を記録 |

- coverage 設定（`include`）が A3 ファイルを含むこと、無関係ファイルを巻き込んでいないことを確認する。必要に応じ測定時のみ対象を `scripts/smoke/verify-runtime-smoke-secret-contract.mts` に絞る。

## 期待値と証跡の残し方

| 関数 | line 目標 | branch 目標 | 主な branch（網羅すべき分岐） |
| ---- | ---- | ---- | ---- |
| `extractWorkflowSecrets` | 100% | 100% | マッチあり / マッチ 0 件（TC-E01/E02）・重複あり / なし（TC-4） |
| `extractProvisionedSecrets` | 100% | 100% | op 参照行あり / なし（TC-5/E03）・コメント行除外（TC-E09） |
| `detectSecretContractViolations` | 100% | 100% | gap あり / なし（TC-1/TC-2）・rationale 付き exemption / 空 rationale（TC-3/E05/E06）・stale provision warn（TC-E07） |

- 実測値（`% Lines` / `% Branch` の数値）を本フェーズの成果として記録する。100% に満たない行・分岐があれば、それを踏むテストケースを Phase 6 に追記してから再測定し、最終的に line / branch 100% の実測値を証跡として残す。

## 計測外領域の担保（明記）

- YAML（A2 / A5）と shell（A1）は Vitest coverage の計測対象外。これらは `actionlint`（YAML 構文・式参照）と `bash -n`（shell 構文）、および Phase 4/6 の手動 trace（M-1..M-5）で品質を担保する。「coverage 数値が出ない＝未検証」ではないことを本セクションで明示する。
- `main()` / entry guard は `process.exit` と実ファイル I/O を含むため、unit の branch 100% を必須とせず RG-2 の `tsx` 実走（実ファイル統合）で line 到達を確認する方針とする。

## 参照資料

| 資料 | パス | 用途 |
| ---- | ---- | ---- |
| quality-e2e-testing | `.claude/skills/aiworkflow-requirements/references/quality-e2e-testing.md` | カバレッジと E2E/統合の役割分担 |
| testing-fixtures | `.claude/skills/aiworkflow-requirements/references/testing-fixtures.md` | branch 網羅のための fixture 設計 |
| issue-526 actionlint/shellcheck gate | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` | YAML/shell を coverage 計測外で担保する先例 |
| ci-test-recovery coverage 80 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-ci-test-recovery-coverage-80-2026-05-04.md` | カバレッジ対象範囲を変更行に限定する判断の先例 |

## 完了条件

- [ ] カバレッジ対象を A3 の新 verifier 変更行に限定明示している（Feedback BEFORE-QUIT-002 / Feedback 5）。
- [ ] `detectSecretContractViolations` / `extractWorkflowSecrets` / `extractProvisionedSecrets` の line / branch 100% を目標とし、実測値を証跡に残す方針が定義されている。
- [ ] 各関数の網羅すべき branch が Phase 4/6 の TC と対応づけられている。
- [ ] YAML / shell が coverage 計測外であり `actionlint` / `bash -n` / 手動 trace で担保されることを明記している。
- [ ] `main()` / entry guard を RG-2 実走で line 到達確認する方針が明記されている。
