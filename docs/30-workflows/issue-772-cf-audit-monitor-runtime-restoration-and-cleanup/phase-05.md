# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | spec_created |

## 目的

Phase 4 task を実行順序に並べ、user-gated 操作と local 操作を明確に区別する。

## 実行順序（時系列）

```
[local]   T-01 inventory before snapshot (read-only)
            │
[user-gated]  T-02 secrets 投入 ──┐
            │                     │ 順次（race condition 回避）
[user-gated]  T-03 variables 投入 ─┘
            │
[user-gated]  T-04 workflow_dispatch dry_run
            │      ↓ success 確認後
[runtime]   T-05 hourly 6 連続 success 観測（wallclock 6h）
            │      ↓ success 確認後
[local]   T-06 inventory after snapshot + cleanup no-op evidence
            │
[local]   T-07 runbook ADR ステータス追記
            │
[local]   T-08 unassigned-task fold-state sync
            │
[user-gated]  T-09 PR base=dev で PR 作成
```

## local vs user-gated 区分

| 区分 | task | 実行主体 |
| --- | --- | --- |
| local（自律実行可） | T-01 (read-only inventory) / T-06 (read-only inventory) / T-07 (docs edit) / T-08 (docs edit) | Claude / Codex 自律 |
| user-gated | T-02 (secrets) / T-03 (variables) / T-04 (workflow_dispatch) / T-09 (push, PR) | user 明示承認後のみ |
| runtime（観測のみ） | T-05 (read-only run list) | wallclock 待ち |

## 実装内容（Phase 06 への入力）

Phase 06 では以下を成果物として生成:

1. T-01 / T-06 用 inventory 取得 shell script ガイド
2. T-02 / T-03 投入コマンド（user-gated、`op read op://...` 経由）
3. T-04 dispatch コマンド
4. T-05 観測コマンド（`gh run list` + jq filter）
5. T-07 runbook ADR diff ドラフト
6. T-08 unassigned-task fold-state diff ドラフト
7. T-09 PR summary diff ドラフト

## CONST_007 遵守確認

- 全 task が本サイクル内で完了可能
- 「将来 PR で対応」「バックログ送り」項目は無し
- runtime 6h 待ちは sleep が必要だが、これは「先送り」ではなく runtime 観測の必然性
- user-gated 操作は user の手元で 1 サイクル内に完了する想定

## 完了条件

- [x] 実行順序が時系列で確定
- [x] local / user-gated / runtime の区分明確化

## 次 Phase

- 次: 6 (実装手順)
- 引き継ぎ事項: 9 task の実行順序 + Phase 06 で生成すべき 7 成果物
