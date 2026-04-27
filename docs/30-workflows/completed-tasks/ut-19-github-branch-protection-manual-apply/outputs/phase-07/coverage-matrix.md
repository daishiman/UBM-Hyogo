# Phase 7: AC × Phase トレース表

## カバレッジマトリクス

| AC | 内容 | Phase 1 | Phase 2 | Phase 4 | Phase 5 | Phase 6 | Phase 7 | Phase 11 | 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | main protection の各属性 | 定義 | payload | 事前確認 | 適用・検証 | 異常系 | 集約 | UI 確認 | PASS |
| AC-2 | dev protection の各属性 | 定義 | payload | 事前確認 | 適用・検証 | 異常系 | 集約 | UI 確認 | PASS |
| AC-3 | production env policy | 定義 | 設計 | 既存確認 | 既存検証 | — | 集約 | UI 確認 | PASS |
| AC-4 | staging env policy | 定義 | 設計 | 既存確認 | 既存検証 | — | 集約 | UI 確認 | PASS |
| AC-5 | before / after JSON 証跡 | 定義 | — | 出力先確認 | 出力 | — | 集約 | — | PASS |
| AC-6 | runbook と実適用の乖離なし | 定義 | runbook 参照 | — | runbook 通り適用 | — | dry-diff 集約 | — | PASS |
| AC-7 | `develop` 残存なし | 定義 | — | grep | — | grep 詳細 | 集約 | — | PASS |

## 値の最終確認（after snapshot から抜粋）

### main

```json
{
  "reviews": 0,
  "status_checks": ["ci", "Validate Build"],
  "force_push": false,
  "deletions": false,
  "enforce_admins": false,
  "dismiss_stale": false
}
```

### dev

```json
{
  "reviews": 0,
  "status_checks": ["ci", "Validate Build"],
  "force_push": false,
  "deletions": false
}
```

### environments

- production: `branch_policies = [{name: "main"}]`、`total_count = 1`
- staging: `branch_policies = [{name: "dev"}]`、`total_count = 1`

## ランブック乖離

なし。runbook §1 / §2 の payload と実適用 payload は完全一致。Environments は runbook §3 / §4 が指す UI 操作の結果と既存の API 状態が一致。

## 結論

AC-1〜AC-7 すべて PASS。Phase 8 へ進む。
