# Phase 9 成果物 — 無料枠見積もり

## 前提

- production cron: 6 時間ごと → 1 日 4 回 → 月 ≈ 120 回
- staging cron: 1 時間ごと → 1 日 24 回 → 月 ≈ 720 回
- 1 run あたりの想定行数: 200 (会員数 200 を想定。1000 行までは余裕)
- batch サイズ: 100 行 → 1 run で 2 batch

## Cloudflare Workers

| 指標 | 月間使用量 (prod + staging) | 無料枠 | 使用率 |
| --- | --- | --- | --- |
| Requests | 120 + 720 + admin manual ≈ 1000 | 100,000 / 日 | < 0.1% |
| CPU time | 1 run ≈ 5 秒 → 月 ≈ 70 分 | 10ms × 100,000/日 | 範囲内 |

## Cloudflare D1

| 指標 | 月間使用量 | 無料枠 | 使用率 |
| --- | --- | --- | --- |
| writes | 200 行 × 840 run ≈ 168,000 | 50,000/日 (≈ 1,500,000/月) | ≈ 11% |
| reads | API 経由は別タスク。sync 自体の reads は lock チェック等で 4 / run | 25M/月 | < 1% |
| storage | 200 行 × 数 KB ≈ 数 MB | 5GB | < 1% |

## Google Sheets API

| 指標 | 月間使用量 | quota | 使用率 |
| --- | --- | --- | --- |
| `spreadsheets.values.get` | 1 / run × 840 run ≈ 840 | 300 req/min/project | < 1% |

## 結論

すべての指標で無料枠の **20% 未満** に収まる。staging を 1 時間ごとに動かしても余裕がある。

## 想定外シナリオ

- 会員数が 1 万行を超える場合: `buildA1Ranges` で複数 range に分割し、1 run の writes を分散
- staging を 5 分ごとに動かす場合: D1 writes が 50% 近辺になるため要モニタリング
