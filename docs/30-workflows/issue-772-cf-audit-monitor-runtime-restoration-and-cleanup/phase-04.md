# Phase 4: タスク分解

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | spec_created |

## 目的

Phase 2 設計を実行可能な単位タスクに分解し、Phase 5-13 に割り当てる。

## タスク分解（単一責務）

| Task ID | 概要 | 種別 | 担当 Phase | 依存 |
| --- | --- | --- | --- | --- |
| T-01 | inventory-before snapshot 取得手順を実行可能化 | docs+ops | 6 / 11 | なし |
| T-02 | repo-level secrets 4 件投入手順を実行可能化 | ops（user-gated） | 6 | T-01 |
| T-03 | repo-level variables 8 件投入手順を実行可能化 | ops（user-gated） | 6 | T-01, T-02 |
| T-04 | `workflow_dispatch -f dry_run=true --ref dev` 実行と evidence 記録 | runtime | 11 | T-02, T-03 |
| T-05 | hourly 6 連続 success 観測と evidence 記録 | runtime | 11 | T-04 |
| T-06 | inventory-after snapshot 取得と cleanup no-op 確定 evidence | docs+ops | 13 | T-05 |
| T-07 | `15-infrastructure-runbook.md` environment-separation ADR ステータス追記 | docs | 8 | T-06 |
| T-08 | 原典 unassigned-task に `consumed_via_issue_772_runtime_restoration_spec` 同期 | docs | 12 | T-07 |
| T-09 | PR base=dev で PR summary ドラフト作成 | docs | 13 | T-07, T-08 |

## 完了条件

- [x] T-01 〜 T-09 の依存関係が確定
- [x] 各 task が単一責務原則を満たす

## 次 Phase

- 次: 5（実装計画）
- 引き継ぎ事項: T-01〜T-09 の依存グラフ
