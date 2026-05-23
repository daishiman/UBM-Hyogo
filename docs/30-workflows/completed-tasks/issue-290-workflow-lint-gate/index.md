# Issue #290: Workflow lint gate with actionlint and yamllint

[実装区分: 実装仕様書]
判定根拠: 本タスクは `.github/workflows/*.yml` を CI で構文検査する gate を導入するため、既存 `workflow-shell-lint` job と local reproduction command の実コード変更を伴う。CONST_004 のドキュメントのみ例外には該当しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/290 |
| 親タスク | UT-CICD-DRIFT |
| task_id | UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE |
| 規模 | 小 |
| 優先度 | 中 |
| 作成日 | 2026-05-17 |
| status | implemented_local_evidence_captured |
| visualEvidence | NON_VISUAL |
| 関連 issue | #58 (依存), #526 (subset 先行実装) |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING (GitHub Actions runtime evidence / commit / push / PR は user-gated) |
| coverage AC 適用外 | workflow YAML + runbook + 正本同期のみ。production TS runtime は変更しないため `coverage-guard` は N/A。 |

## 背景

UT-CICD-DRIFT Phase 11 で `actionlint` / `yamllint` がローカル未導入のため N/A 判定となった。先行 issue #526 で `ci.yml` の `workflow-shell-lint` job に actionlint を 9 workflow 限定で導入したが、`.github/workflows/*.yml` 32 件のうち **21 件が未カバー**であり、追加された新規 workflow が drift の温床になっている。

## 現状ギャップ

| 領域 | 現状 | 期待 |
| --- | --- | --- |
| actionlint カバレッジ | `ci.yml` 内 9 件 + 自己 lint 2 件 = 11/32 | 全 32 件カバー（ホワイトリスト or glob 化） |
| yamllint 採否判断 | 未判断 | 採用 or 不採用の理由を本文書に固定 |
| ローカル復旧手順 | 未記載 | runbook 化（actionlint インストール / 実行コマンド） |

## 範囲（含む / 含まない）

| 含む | 含まない |
| --- | --- |
| `.github/workflows/*.yml` 全件への actionlint 適用 | branch protection 変更 |
| yamllint 採否判断と記録 | shellcheck 範囲拡大 |
| ローカル復旧 runbook 追加 | Discord 通知連携 |
| `ci.yml` の `workflow-shell-lint` job 改修 | 新規 deploy target 追加 |

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 | D1 直接アクセス禁止 | 影響なし |
| #6 | GAS prototype 昇格禁止 | 影響なし |
| solo policy | required reviewer = 0 | 影響なし（CI required check 追加候補のみ） |

## 受入条件 (AC)

- AC-1: PR で `.github/workflows/*.yml` の全 32 件が actionlint で検査される
- AC-2: `actionlint` 未導入ローカル環境からの復旧手順が runbook 化されている
- AC-3: `yamllint` の採否（採用 / 不採用）と理由が本ディレクトリ配下に記録されている
- AC-4: `.github/workflows/ci.yml` と `package.json` の local reproduction command が同じ glob scope / actionlint version を使う
- AC-5: Phase 12 strict 7、root/output `artifacts.json`、aiworkflow-requirements 正本同期が同一 wave で揃っている

## 受入条件 close-out

| AC | 状態 | 根拠 |
| --- | --- | --- |
| AC-1 | completed (local deterministic evidence captured) | `workflow-shell-lint` と `pnpm observation:lint` が `.github/workflows/*.yml` を対象化。GitHub Actions runtime evidence は Phase 13 user gate |
| AC-2 | completed (runbook present) | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` |
| AC-3 | completed (decision recorded) | `outputs/phase-02/yamllint-decision.md` |
| AC-4 | completed (scope/version synchronized) | actionlint `1.7.7` + `.github/workflows/*.yml` |
| AC-5 | completed (Phase 12 strict files and artifacts parity recorded) | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Phase 構成

| Phase | 内容 | パス |
| --- | --- | --- |
| 1 | 要件定義 | `phase-01.md` |
| 2 | 設計 | `phase-02.md` |
| 3 | 設計レビュー | `phase-03.md` |
| 4 | テスト戦略 | `phase-04.md` |
| 5 | 実装計画 | `phase-05.md` |
| 6 | 失敗ケース | `phase-06.md` |
| 7 | AC マトリクス | `phase-07.md` |
| 8 | 静的検査 | `phase-08.md` |
| 9 | 品質ゲート | `phase-09.md` |
| 10 | Go/No-Go | `phase-10.md` |
| 11 | smoke 検証 | `phase-11.md` |
| 12 | 実装ガイド | `phase-12.md` |
| 13 | PR 化 | `phase-13.md` |

## 関連

- 親: UT-CICD-DRIFT
- subset 先行: #526 (`docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/`)
- required check 同期候補: UT-GOV-001
