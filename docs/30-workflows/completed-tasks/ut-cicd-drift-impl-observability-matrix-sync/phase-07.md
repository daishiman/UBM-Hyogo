# Phase 7: カバレッジ確認（観測対象カバレッジ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認（観測対象カバレッジ） |
| 前 Phase | 6 (テスト拡充) |
| 次 Phase | 8 (品質ゲート) |
| 状態 | spec_created |

## 目的

docs-only 改修の特性に合わせ、コードカバレッジではなく **「`.github/workflows/` 全 yaml と SSOT の対応マトリクス」** を確認する。
本タスクスコープ内 5 本が 100% 同期済みであることを示し、スコープ外 3 本を未タスク候補として Phase 12 起票予約に確定する。

## 観測対象カバレッジマトリクス

| # | workflow file | 本タスクスコープ | SSOT 同期状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `ci.yml` | 内 | 同期済み (Phase 5 D-1/D-2/D-3) | dev / main 両環境 |
| 2 | `backend-ci.yml` | 内 | 同期済み (Phase 5 D-1/D-2/D-3) | deploy-staging / deploy-production |
| 3 | `validate-build.yml` | 内 | 同期済み (Phase 5 D-3) | mapping 表で識別子明示 |
| 4 | `verify-indexes.yml` | 内 | 同期済み (Phase 5 D-1/D-2/D-3) | indexes drift gate |
| 5 | `web-cd.yml` | 内 | 同期済み (Phase 5 D-1/D-2/D-3) | deploy-staging / deploy-production |
| 6 | `e2e-tests.yml` | 外 | 未同期（意図的） | 未タスク候補 #1 |
| 7 | `pr-build-test.yml` | 外 | 未同期（意図的） | 未タスク候補 #2 |
| 8 | `pr-target-safety-gate.yml` | 外 | 未同期（意図的） | 未タスク候補 #3 |

### スコープ内カバレッジ

- 5 / 5 = **100%** が SSOT に同期済み。
- 4 列分離 mapping 表（file / display name / job id / required status context）に全件登録済み。
- Discord current facts セクションに 5 件すべて列挙済み。

### スコープ外（未タスク候補）

| 候補 ID | 対象 | 理由 | Phase 12 分離先 |
| --- | --- | --- | --- |
| UNTASK-1 | `e2e-tests.yml` を SSOT 観測対象へ取り込み | E2E は別 owner / 別 cost 系統。混入回避のため別タスク | `docs/30-workflows/unassigned-task/task-08b-playwright-e2e-full-execution-001.md` |
| UNTASK-2 | `pr-build-test.yml` を SSOT 観測対象へ取り込み | PR 限定 trigger のため運用観点が異なる | `docs/30-workflows/unassigned-task/task-ref-cicd-workflow-topology-drift-001.md` / `UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE.md` |
| UNTASK-3 | `pr-target-safety-gate.yml` を SSOT 観測対象へ取り込み | safety-gate は governance 文脈で UT-GOV 系へ寄せる候補 | `docs/30-workflows/unassigned-task/UT-GOV-002-EVAL-oidc-and-workflow-run.md` |

## 変更行カバレッジ

Phase 5 で適用した差分 D-1〜D-5 の各行が、Phase 4 検証コマンドのいずれかでガードされていることを確認する。

| 差分 | 保護コマンド |
| --- | --- |
| D-1 (dev 観測対象 +3 行) | T-1（5 workflow 全件列挙） |
| D-2 (main 観測対象 +3 行) | T-1 |
| D-3 (4 列分離 mapping 表) | T-1 / T-4（display name 突き合わせ） |
| D-4 (Discord current facts) | T-2（実体 0 件と SSOT 注記の整合） |
| D-5 (旧 path 置換) | T-3（旧 path 0 件） |

→ 全差分が検証コマンドで保護されている。**変更行カバレッジ: 100%**。

## カバレッジ判定

| 項目 | 結果 |
| --- | --- |
| スコープ内 workflow カバレッジ | 5 / 5 (100%) |
| 変更行カバレッジ | 5 / 5 差分 (100%) |
| スコープ外未タスク化 | 3 件を Phase 12 で既存未タスクへ委譲 |
| 結論 | **Phase 8（品質ゲート）へ進行可** |

## 成果物

- `outputs/phase-07/main.md` — 観測対象カバレッジマトリクスと未タスク候補一覧
