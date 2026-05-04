# Phase 7: テストカバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

Phase 6 で取得した coverage 実測値を AC（≥80%）と照合し、PASS / カバレッジループ（Phase 6 戻り）を判定する。

## カバレッジ判定

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
| いずれか未達 | Phase 6（本タスクスコープではないので Task C / D へ差戻し）|

## 大規模ファイル特例

本タスクは新規コード追加なし。大規模ファイル特例（500 行超ガイドライン）は適用外。

## 個別ファイル計測

本タスクで coverage 未達が発生した場合、それは Task C / D の取り込み漏れを意味する。本タスクで個別補強せず、必ず Task C / D へ差戻す（CONST_007 で本タスク内完結を選ぶ場合は `unassigned-task-detection.md` に exclude 採用理由を明記）。

## 成果物

- `outputs/phase-7/coverage-judgment.md`（PASS / FAIL 判定 + 不足ファイル top10）

## 完了条件

- [ ] 全 package 全 metric PASS の判定 or NO-GO 判定が記録されている
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] 判定結果が Phase 6 実測と整合している

## 次 Phase

Phase 8（統合テスト）。
