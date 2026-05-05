# Phase 2 — 設計（export 方式 decision matrix）

## 目的

3 つの候補（A: GraphQL Analytics API / B: dashboard 手動 CSV export / C: dashboard screenshot）を比較し、採用 1 案と不採用理由を確定する。

## 候補と評価軸

| 軸 | A: GraphQL Analytics API | B: 手動 CSV | C: screenshot |
| --- | --- | --- | --- |
| Free plan 可否 | 利用可（要 token） | 利用可 | 利用可 |
| 自動化適性 | 高（後続 task で cron 化容易） | 中（手動操作） | 低（OCR 必要） |
| 集計値限定の容易性 | 高（query で field 限定） | 中（CSV から不要列削除） | 低（画像から数値抽出困難） |
| PII 混入リスク | 低（aggregate のみ取得） | 中（CSV 全列で混入可能） | 低（aggregate のみ） |
| retention 管理 | repo 内ファイルで明示 | 同左 | 同左 |
| 比較分析適性 | 高（数値で diff 可能） | 高 | 低 |
| 1 サイクル内完結 | 可 | 可 | 可 |

## 推奨案

A: GraphQL Analytics API（aggregate-only query）。理由:

- 集計値（req/day, error rate, D1 reads/writes, cron volume）を field 単位で limit でき、PII 混入リスクが構造的に最小
- 後続自動化（cron fetcher）への発展が容易（独立タスクで起票予定）
- 数値比較分析が直接可能で、postmortem 用途に最適

B は緊急時の fallback として手順だけ記述する。C は採用しない。

## 出力

- `outputs/phase-02/main.md`: 推奨案と判断要旨
- `outputs/phase-02/decision-matrix.md`: 上記比較表 + Free plan 制約 + 採用 / 不採用理由

## 完了条件

- [ ] decision-matrix.md に 3 候補 × 7 軸の比較が完成
- [ ] 推奨 1 案 + fallback 1 案が確定
- [ ] AC-1 を満たす（採用 1 案 + 他案の判定が記述）

## 受け入れ条件（AC mapping）

- AC-1: 採用方式の確定
- AC-4: 集計値限定容易性の評価が比較表に含まれる

## 検証手順

```bash
test -f docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-02/decision-matrix.md
grep -c "GraphQL\|CSV\|screenshot" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-02/decision-matrix.md
```

## リスク

| リスク | 対策 |
| --- | --- |
| GraphQL Analytics API が Free plan で field 制限される | Phase 9 で公式ドキュメントから quota / 利用可能 dataset を確認し fallback B へ切替判断 |
| token 管理が新規で必要 | 1Password + scripts/cf.sh 拡張で対応（実装は別タスク。本タスクでは取得手順記述のみ） |
