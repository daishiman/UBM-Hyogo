# Phase 11: - 手動テスト（VISUAL: screenshot 4 点 + 3 層評価）

[実装区分: 実装仕様書 / Phase 11 / VISUAL task]

## 目的

dashboard の screenshot 4 点を取得し、3 層評価（Semantic / Visual / AI UX）を実施する。`screenshot-plan.json` に `mode: "VISUAL"` を明記し、`phase11-capture-metadata.json` を作成する。

## screenshot 4 点（必須）

| # | filename | 描画対象 | viewport |
| --- | --- | --- | --- |
| 1 | `fallback-rate-trend.png` | fallback rate 週次プロット + threshold/ML 期比較線 | 1280x720 |
| 2 | `p95-latency-trend.png` | p95 latency 週次プロット + 比較線 | 1280x720 |
| 3 | `issue-rate-trend.png` | Issue 起票数週次プロット + 比較線 | 1280x720 |
| 4 | `leakage-count-trend.png` | leakage grep 件数週次プロット + 比較線 | 1280x720 |

配置: `outputs/phase-11/evidence/screenshots/`

## screenshot-plan.json（template）

```jsonc
{
  "mode": "VISUAL",
  "task": "u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash",
  "captures": [
    { "id": 1, "name": "fallback-rate-trend",   "url_or_path": "<候補A: http://localhost:8788/admin/audit/dashboard#fallback | 候補B: docs/dashboards/cf-audit-log-7day-trend/index.html#fallback>", "viewport": "1280x720" },
    { "id": 2, "name": "p95-latency-trend",     "url_or_path": "...#p95",     "viewport": "1280x720" },
    { "id": 3, "name": "issue-rate-trend",      "url_or_path": "...#issues",  "viewport": "1280x720" },
    { "id": 4, "name": "leakage-count-trend",   "url_or_path": "...#leakage", "viewport": "1280x720" }
  ]
}
```

## phase11-capture-metadata.json（template）

```jsonc
{
  "captured_at": "2026-05-XXTHH:MM:SSZ",
  "git_sha": "<sha>",
  "branch": "<branch>",
  "implementation_choice": "<admin-ui | static-html>",
  "data_source": "docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/hourly-run-7day-summary.json",
  "weeks_visualized": <N>,
  "screenshots": [
    { "id": 1, "file": "evidence/screenshots/fallback-rate-trend.png", "sha256": "..." },
    { "id": 2, "file": "evidence/screenshots/p95-latency-trend.png",   "sha256": "..." },
    { "id": 3, "file": "evidence/screenshots/issue-rate-trend.png",    "sha256": "..." },
    { "id": 4, "file": "evidence/screenshots/leakage-count-trend.png", "sha256": "..." }
  ]
}
```

## 撮影手順

### 候補 A (admin UI) の場合

```bash
# 1. ローカル起動
mise exec -- pnpm --filter @ubm-hyogo/web dev
# 2. Auth.js admin session でログイン (manjumoto.daishi@senpai-lab.com)
# 3. http://localhost:8788/admin/audit/dashboard を開く
# 4. 各セクション (#fallback / #p95 / #issues / #leakage) を順に capture
```

### 候補 B (静的 HTML) の場合

```bash
# 1. aggregator で trend JSON 生成
mise exec -- pnpm tsx scripts/cf-audit-log/dashboard/aggregate-weekly.ts \
  --input docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence \
  --out docs/dashboards/cf-audit-log-7day-trend/trend-weekly.json
# 2. ブラウザで file:// open し、4 セクションを capture
```

## 3 層評価

`outputs/phase-11/evidence/three-layer-evaluation.md` に以下を記録:

| 層 | 観点 | 判定基準 |
| --- | --- | --- |
| Semantic | 4 指標のラベル / 単位 / 凡例の意味整合 | reviewer 1 名（solo dev）が 30 秒以内に意味把握可能 |
| Visual | OKLch トークン適用 / 色覚配慮 / 軸ラベル可読 | `verify-design-tokens` pass / contrast ratio AA |
| AI UX | dashboard を見て次のアクションを 1 つ即時決定可能か | 「fallback rate 2 週連続上昇 → ML model 再選定検討」等の actionable 推論を 1 つ書き残す |

## 出力

- `outputs/phase-11/main.md`
- `outputs/phase-11/screenshot-plan.json`
- `outputs/phase-11/phase11-capture-metadata.json`
- `outputs/phase-11/evidence/screenshots/{fallback-rate,p95-latency,issue-rate,leakage-count}-trend.png`
- `outputs/phase-11/evidence/three-layer-evaluation.md`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 状態 | spec_created |

## 実行タスク

- 本文の目的・手順・出力に従う。

## 参照資料

- `index.md`
- `artifacts.json`

## 成果物

- `outputs/phase-*` に定義された成果物。

## 完了条件

- [ ] 本 Phase の出力仕様が `artifacts.json` と一致している。

## 統合テスト連携

- 実装 Phase で指定された focused command と Phase 09 品質ゲートに接続する。
