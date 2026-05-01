# Phase 1 outputs — 要件定義 main

本ファイルは `phase-01.md` の成果物 mirror。Phase 1 で確定した内容を artifacts 参照経路から辿れる形で保管する。

## 確定事項サマリ

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| docs_only | false |
| visualEvidence | NON_VISUAL（curl ログ主体・staging screenshot 1 枚補助） |
| workflow_state | spec_created |
| 主担当不変条件 | #5（3層分離） |
| 副担当不変条件 | #1 / #6 |
| 主目的 | 04a public API 実体 + D1 binding を使った local + staging smoke の実施 |

## 真の論点（要約）

1. mock smoke では検出できない実 Workers runtime / D1 binding / `PUBLIC_API_BASE_URL` 経路の検証
2. esbuild Host/Binary version mismatch（`0.27.3` vs `0.21.5`）の恒久対応 — `scripts/cf.sh` 経由を唯一の起動経路に固定
3. mock vs 実 D1 の判別を seed データ or 404 応答で evidence 化
4. staging `PUBLIC_API_BASE_URL` 未設定時の localhost fallback 検出を smoke gate に含める

## AC 一覧（断定形・検証手段付き）

AC-1〜7 は `index.md` の AC セクションを正本とする。Phase 1 では各 AC を「検証手段が断定形であるか」で査読し、合格と判定。

## 不変条件 trace

- #5（中心）: smoke 経路自体が `apps/web → apps/api → D1` の 3 層分離を実行する。AC-7 で `apps/web` 側 D1 直接 import 0 件を `rg` で再確認
- #1: `/members` レスポンスが extraFields 経路を保ち 200 を返すことで間接確認
- #6: smoke 対象は `apps/api` 実体のみ、GAS prototype 経路は触らない

## artifacts.json metadata（Phase 1 確定値）

```json
{
  "taskType": "implementation",
  "docs_only": false,
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created",
  "evidence_type": "curl_logs_with_aux_screenshot"
}
```

全 phases[].status は `pending`。Phase 11 実施完了後に対応 phase を `completed` へ。

## 次フェーズへの引き継ぎ

Phase 2 で設計する成果物:
- `scripts/cf.sh` 経由の起動コマンド列
- D1 binding 経路の mermaid（`outputs/phase-02/d1-binding-flow.mmd`）
- local / staging 双方の curl コマンド列
