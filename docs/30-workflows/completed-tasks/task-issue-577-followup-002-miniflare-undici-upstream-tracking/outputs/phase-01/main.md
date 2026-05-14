# Phase 01 outputs / main

## summary

Issue #616（task-issue-577-followup-002）の要件定義を確定。実装区分は「実装仕様書（条件付き）」。

## 真の論点（要約）

1. 軸B（`--maxWorkers=1`）の恒久化リスク
2. 上流改善検知の能動的経路欠如
3. A/B での flaky 誤採用リスク
4. CONST_007 違反の先送り誘惑

## AC（採択）

- AC-1: 追跡 repo / キーワード / 頻度固定
- AC-2: 直近 release を実 triage
- AC-3: 改善なし時 package.json 未変更 evidence
- AC-4: 改善あり時 連続 3 回 PASS / 0 EADDRNOTAVAIL
- AC-5: secret hygiene grep 0 件
- AC-6: apps/api src / migrations 不変

## 不変条件 trace

- #5 D1 直接アクセス禁止（package.json scripts のみ編集）
- CONST_002 commit/push/PR 禁止（Phase 13 まで）
- CONST_007 先送り禁止（今回サイクルで結論を出す）
- aiworkflow-requirements 不変

## artifacts.json metadata 確定

```json
{
  "taskType": "implementation",
  "implementationCategory": "conditional",
  "docs_only": false,
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created",
  "evidence_type": "triage_table_and_optional_ab_logs"
}
```

## 次フェーズ

Phase 2 で追跡フロー設計（3 repo / 6 キーワード / 月次 trigger）に進む。
