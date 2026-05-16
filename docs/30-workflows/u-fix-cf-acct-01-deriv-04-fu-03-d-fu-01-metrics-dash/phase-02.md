# Phase 2: - 設計（aggregator + dashboard 2 案比較）

[実装区分: 実装仕様書 / Phase 02]

## 目的

aggregator script の I/O 設計、`schema_version` 設計、dashboard 描画 2 案比較表、データフロー図、ステップ間 state 引き渡しテーブルを確定する。

## 1. aggregator script 設計

### 入力

```
inputDir/
  2026-W18/hourly-run-7day-summary.json
  2026-W19/hourly-run-7day-summary.json
  ...
```

または flat:

```
inputDir/
  hourly-run-7day-summary-2026-W18.json
  hourly-run-7day-summary-2026-W19.json
```

CLI:

```bash
mise exec -- pnpm tsx scripts/cf-audit-log/dashboard/aggregate-weekly.ts \
  --input <dir> \
  --out outputs/trend-weekly.json \
  --weeks 12 \
  --baseline outputs/threshold-baseline.json
```

### 出力 schema (trend JSON)

```jsonc
{
  "schema_version": "1.0.0",
  "generated_at": "2026-05-14T00:00:00Z",
  "weeks": [
    {
      "week_starting": "2026-W18",
      "fallback_rate_mean": 0.012,
      "p95_latency_ms": 145,
      "issues_opened_total": 0,
      "leakage_count": 0,
      "phase": "ml"
    }
  ],
  "baseline": {
    "phase": "threshold",
    "fallback_rate_mean": 0.045,
    "p95_latency_ms": 152,
    "issues_opened_total": 1,
    "leakage_count": 0
  }
}
```

### 集約ロジック

1. inputDir を再帰探索し `*.json` を読み込む
2. 各 JSON の `schema_version` を検証（未指定は warn + skip、unsupported explicit version / 型不正は throw、`1.0.0` のみ accept）
3. `week_starting` field を key にして週次 grouping。`schema_version: "1.0.0"` で `week_starting` が無い場合のみ `generated_at` から補完する
4. `--weeks N` 指定で直近 N 週に絞り込み
5. baseline JSON があれば parse して output に並記
6. 出力 directory が無ければ throw（非存在ディレクトリへの書き込み禁止）

### ISO week 計算

- `schema_version: "1.0.0"` かつ `week_starting` が無い入力 JSON に対しては、`generated_at` から ISO 8601 week (`YYYY-Www`) を算出（境界: 年跨ぎ・53 週年は Phase 4 で fixture 化）
- 計算は追加依存なしの native `Date` 実装に閉じる。`date-fns` 等の依存追加は行わない。

## 2. `schema_version` 設計

| version | 意味 | 互換性 |
| --- | --- | --- |
| `"1.0.0"` | 本タスクで導入する初版 | accept。`week_starting` 欠落時のみ `generated_at` から native ISO week 補完 |
| 未指定（implicit old JSON） | 親 #586 で生成済みの古い JSON | warn + skip。手動で `week_starting` を補完する場合は別 script `migrate-summary.ts` を将来検討（本サイクル外） |
| `"2.0.0"` 系の unsupported explicit version | 将来 schema / 誤入力 | throw（silent skip 禁止） |
| 数値の型不正 | 壊れた schema | throw |

## 3. dashboard 描画 2 案比較表

`outputs/phase-02/dashboard-options.md` に以下を含める:

| 項目 | 候補 A: admin UI 組込 | 候補 B: 静的 HTML |
| --- | --- | --- |
| 配置 | `apps/web/src/app/(admin)/admin/audit/dashboard/page.tsx` | `docs/dashboards/cf-audit-log-7day-trend/index.html` |
| 認証 | Auth.js セッション必須（admin role gate） | なし（local 閲覧のみ。public 公開しない） |
| デプロイ | Cloudflare Workers (`apps/web` build) | git commit のみ |
| データ取得 | build-time fetch or static JSON import | inline JSON 埋め込み |
| chart lib | recharts (既存 package 確認) or 自前 SVG | 自前 SVG / Chart.js CDN |
| 簿価 | 中（既存 admin UI に 1 page 追加） | 小（HTML 1 ファイル） |
| 運用継続性 | 高（既存 admin 動線に統合） | 中（git pull 必要） |
| design-token 整合 | OKLch トークン正本適用必須 | 静的 HTML でも tokens 値を inline で踏襲推奨 |

## 4. データフロー図

`outputs/phase-02/dataflow.md` に Mermaid 図を配置:

```
[GitHub Actions cf-audit-log-7day-summary.yml]
  └─> hourly-run-7day-summary.json (週 1 回)
        + week_starting + schema_version (本タスクで追加)
  └─> commit to docs/30-workflows/completed-tasks/issue-586-.../outputs/phase-11/evidence/
[scripts/cf-audit-log/dashboard/aggregate-weekly.ts]
  └─> 過去 N 週の JSON を集約
  └─> trend-weekly.json (4 指標 × 週次)
[Dashboard 描画 (admin UI or 静的 HTML)]
  └─> 4 指標時系列 + threshold/ML 期比較線
```

## 5. ステップ間 state 引き渡しテーブル

| from | to | state 名 | 形式 |
| --- | --- | --- | --- |
| workflow YAML | aggregator | `hourly-run-7day-summary.json` (with `week_starting`) | JSON file |
| aggregator | dashboard | `trend-weekly.json` | JSON file |
| baseline source（親 #549） | aggregator | `threshold-baseline.json` | JSON file |
| dashboard | reviewer | screenshot 4 点 | PNG |

## 出力

- `outputs/phase-02/main.md` — 設計サマリ
- `outputs/phase-02/dataflow.md` — データフロー図
- `outputs/phase-02/dashboard-options.md` — 2 案比較表

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
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
