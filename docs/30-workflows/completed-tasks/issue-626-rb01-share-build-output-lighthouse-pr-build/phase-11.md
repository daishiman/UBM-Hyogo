# Phase 11: 実行 evidence


## 目的

Issue #626 RB-01 の Phase 11 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 11 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## evidence 配置（NON_VISUAL canonical）

| path | 内容 |
| --- | --- |
| `outputs/phase-11/evidence/typecheck.log` | `pnpm typecheck` 出力 |
| `outputs/phase-11/evidence/lint.log` | `pnpm lint` 出力 |
| `outputs/phase-11/evidence/actionlint.log` | `actionlint .github/workflows/pr-build-test.yml` 出力（exit 0 は出力 0 行でも PASS） |
| `outputs/phase-11/evidence/patch-regression.log` | `node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` 出力 |
| `outputs/phase-11/evidence/next-secret-grep.txt` | `apps/web/.next/` の secret grep 結果（secret value 0 件。`process.env.*` symbol 参照は分類して許容） |
| `outputs/phase-11/evidence/lighthouse-yml-removed.txt` | `test ! -f .github/workflows/lighthouse.yml && echo ok` |
| `outputs/phase-11/evidence/dry-run-pr-checks.txt` | `gh pr checks <PR>` 出力 |
| `outputs/phase-11/evidence/dry-run-lighthouse-ci-log.txt` | dry-run PR の `lighthouse-ci` job log（`build` step 0 件 evidence） |
| `outputs/phase-11/branch-protection/dev-current.json` | PR 前 read-only dev contexts |
| `outputs/phase-11/branch-protection/main-current.json` | PR 前 read-only main contexts |
| `outputs/phase-11/branch-protection/PENDING_RUNTIME_EVIDENCE.md` | PR merge 後 before/after diff 取得 pending の明示 |
| `outputs/phase-11/evidence/PENDING_RUNTIME_EVIDENCE.md` | dry-run PR checks / `lighthouse-ci` log pending の明示 |

## 状態語彙

- **`spec_created`**: 本仕様書策定完了時点。実 workflow YAML は未変更。
- **`CONTRACT_READY_IMPLEMENTATION_PENDING`**: Phase 5 の実装 runbook に着手したが、local evidence が未完了。
- **`implemented_local_evidence_captured`**: ローカル PASS（typecheck / lint / actionlint / regression / secret grep）取得済。
- **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`**: ローカル実装と deterministic evidence は取得済み。dry-run PR / GitHub Actions 上の `build-test` / `lighthouse-ci` evidence、duplication 0 件 evidence、branch protection before/after diff 0 件が user-gated runtime evidence として未完了。
- **`completed`**: G1〜G4 が完了し、Phase 13 close-out / completed-tasks 移動まで完了。

`PASS` 単独表記は禁止。本仕様の runtime boundary は通常 CI evidence であり、N-day observation 専用語彙は使わない。

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 11 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 1 (`phase-01.md`)
- Phase 2 (`phase-02.md`)
- Phase 5 (`phase-05.md`)
- Phase 6 (`phase-06.md`)
- Phase 7 (`phase-07.md`)
- Phase 8 (`phase-08.md`)
- Phase 9 (`phase-09.md`)
- Phase 10 (`phase-10.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-11.md`
- Phase 11 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] ローカル evidence table の全行が実体として保存され、runtime-only 行は `PENDING_RUNTIME_EVIDENCE` として分離されている
- 状態語彙が現状に正しく対応している（artifacts.json の `metadata.workflow_state` と整合）
