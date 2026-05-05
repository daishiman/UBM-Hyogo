# Phase 7: テストカバレッジ確認（適用外）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

Phase 6 で確認した coverage 維持結果を AC（≥80%）と照合し PASS / カバレッジループ判定を行う。本タスクは新規コード追加なしのため個別ファイル計測は適用外。

## カバレッジ判定（リポジトリ全体維持）

| Metric | 閾値 | 期待 |
| --- | --- | --- |
| Statements | ≥80% | 全 package |
| Branches | ≥80% | 全 package |
| Functions | ≥80% | 全 package |
| Lines | ≥80% | 全 package |

## カバレッジループ

| 条件 | 戻り先 |
| --- | --- |
| 全 package PASS | Phase 8 へ |
| 未達 package が出現 | 本タスクスコープ外（他 PR の取り込み影響）。`unassigned-task-detection.md` に exclude 採用理由を明記し継続 |

## 成果物

- `outputs/phase-7/coverage-decision.md`
