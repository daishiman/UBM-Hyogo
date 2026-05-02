# Phase 2 成果物: 設計

## 1. Worker target inventory 設計

| 項目 | 取得元 | 設計 |
| --- | --- | --- |
| 新 Worker | `apps/web/wrangler.toml` `[env.production].name` | toml parse / fallback `ubm-hyogo-web-production` |
| 旧 Worker | 親タスク `route-secret-observability-design.md` | `--legacy-worker` 引数 / 環境変数 `LEGACY_WORKER_NAME` / default `ubm-hyogo-web` |

inventory 構造:
```
{
  "workers": [
    { "name": "ubm-hyogo-web-production", "role": "current" },
    { "name": "ubm-hyogo-web",            "role": "legacy"  }
  ],
  "axes": ["workers_logs", "tail", "logpush", "analytics_engine"]
}
```

## 2. API / CLI 抽出経路 (4 軸)

| 軸 | 一次取得経路 | plan 制限時 fallback |
| --- | --- | --- |
| R1 Workers Logs | `wrangler.toml` `[env.production.observability]` parse + `cf.sh` 経由 Worker metadata | `N/A (dashboard fallback: Workers & Pages → Worker → Logs)` |
| R2 Tail | Worker 名解決のみ (`wrangler.toml` から target 名を引く) | `N/A (dashboard fallback: Triggers)` |
| R3 Logpush | `bash scripts/cf.sh` で `GET /accounts/{id}/logpush/jobs`, `script_name == <Worker>` で抽出 | `N/A (dashboard fallback: Analytics & Logs → Logpush)` |
| R4 Analytics Engine | `wrangler.toml` `[[analytics_engine_datasets]]` parse | `N/A (dashboard fallback: Workers & Pages → Worker → Settings → Bindings)` |

### 規約
- HTTP method は GET のみ
- すべて `bash scripts/cf.sh` 経由
- 4xx (plan 制限) は exit 0 維持で N/A 出力
- 5xx / network → exit 2 / 認証失敗 → exit 3

## 3. redaction logic 設計

### 出力許可 (allowlist)
- Worker 名 / dataset 名 / host (URL の host 部のみ) / enabled flag / head_sampling_rate / job 名 / filter 概要

### redaction 対象 (denylist)
| ID | 種別 | 正規表現 | 置換後 |
| --- | --- | --- | --- |
| R-01 | API token | `[A-Za-z0-9_-]{40,}` | `***REDACTED_TOKEN***` |
| R-02 | Bearer / Authorization | `(?i)(authorization|bearer|basic)[: ]+\S+` | `***REDACTED_AUTH***` |
| R-03 | URL query / userinfo | `\?[^ ]*` (host 以外) | `?***REDACTED***` |
| R-04 | AWS Access Key | `AKIA[0-9A-Z]{16}` | `***REDACTED_ACCESS_KEY***` |
| R-05 | dataset credential | `dataset_credential[:= ]+\S+` | `dataset_credential=***REDACTED***` |
| R-06 | OAuth token | `ya29\.[A-Za-z0-9_-]+` | `***REDACTED_OAUTH***` |

stdout / stderr の両方に redaction 適用。一時ファイル禁止 (on-memory のみ)。

### golden output sample
```
# observability-target-diff
- legacy:  ubm-hyogo-web
- current: ubm-hyogo-web-production

## R1 Workers Logs
- current: enabled=true head_sampling_rate=1.0
- legacy:  N/A (dashboard fallback: Workers & Pages → Worker → Logs)

## R2 Tail
- current: target=ubm-hyogo-web-production
- legacy:  target=ubm-hyogo-web

## R3 Logpush
- current: jobs=[]
- legacy:  jobs=[]

## R4 Analytics Engine
- current: bindings=[ubm_metrics] datasets=[ubm_events]
- legacy:  bindings=[]

## Diff summary
- legacy-only: 0
- current-only: 3 (R1, R3, R4)
- shared:      1 (R2)
- exit_code:   1
```

## 4. CLI interface

```
bash scripts/observability-target-diff.sh \
  --current-worker ubm-hyogo-web-production \
  --legacy-worker  ubm-hyogo-web \
  [--config apps/web/wrangler.toml] \
  [--format md|json] \
  [--no-color]
```

| exit | 意味 |
| --- | --- |
| 0 | 一致 (差分なし、または plan 制限の N/A のみ) |
| 1 | 差分あり |
| 2 | API 失敗 / network / 5xx / config 不在 |
| 3 | 認証失敗 / 引数不正 |

## 5. runbook 導線

追記先: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/observability-diff-runbook.md` (新規)

章立て: 実行コマンド / 期待出力 / 失敗時のトラブルシュート (exit 2 / 3 / N/A 多発)

## 6. テスト戦略の枠組み

| レイヤー | 範囲 |
| --- | --- |
| unit | `scripts/lib/redaction.sh` の R-01〜R-06 |
| contract | `cf.sh` allowlist 違反検出 / wrangler 直叩き grep 0 件 |
| golden | redaction 後の md 出力の byte-level 一致 |
| 負例 (redaction) | token / OAuth / sink URL credential 入り fixture → 出力に 0 件 |

## 7. 影響範囲・セキュリティ

| 項目 | 方針 |
| --- | --- |
| `.env` 読み取り | 行わない |
| OAuth トークン保持 | 行わない (`wrangler login` 禁止) |
| log 残留 | redaction layer で消去、tmp file 生成しない |
| rate limit | 4 軸を直列実行、429 → backoff (最大 3 回)、それでも 429 なら fallback |
