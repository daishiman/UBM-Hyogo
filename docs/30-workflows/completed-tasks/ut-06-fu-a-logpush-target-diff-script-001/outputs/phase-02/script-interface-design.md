# Phase 2 / script interface 設計

## usage
```
bash scripts/observability-target-diff.sh \
  --current-worker ubm-hyogo-web-production \
  --legacy-worker  ubm-hyogo-web \
  [--config apps/web/wrangler.toml] \
  [--format md|json] \
  [--no-color]
```

## 引数

| 引数 | 必須 | 説明 |
| --- | --- | --- |
| `--current-worker <NAME>` | yes | 新 Worker 名 (`ubm-hyogo-web-production`) |
| `--legacy-worker <NAME>` | yes | 旧 Worker 名 (`ubm-hyogo-web`) |
| `--config <PATH>` | no | wrangler.toml path (default: `apps/web/wrangler.toml`) |
| `--format <md|json>` | no | 出力形式 (default `md`) |
| `--no-color` | no | ANSI 色を抑制 |
| `-h` / `--help` | no | usage を stderr に出して exit 64 |

## 環境変数
- `CLOUDFLARE_API_TOKEN` (op 経由で `cf.sh` が動的注入)
- `CLOUDFLARE_ACCOUNT_ID` (任意。未設定時は `cf.sh whoami` から取得)

## 出力 stream
- stdout: diff 結果 (md または json)
- stderr: 進捗 / 警告 (redaction 通過後)

## exit code

| code | 意味 | AC |
| --- | --- | --- |
| 0 | 一致 (差分なし or N/A のみ) | AC-1 / AC-3 |
| 1 | 差分あり | AC-1 |
| 2 | API 失敗 / network / 5xx / config 不在 | AC-3 / AC-4 |
| 3 | 認証失敗 | AC-5 |
| 64 | usage error (引数不正) | AC-5 |

## read-only 保証
- HTTP method は GET のみ (script 冒頭にコメント宣言)
- POST / PUT / DELETE / PATCH 文字列が script 内に存在しないこと (Phase 9 contract test で grep)
- `wrangler` 直叩きは 0 件 (Phase 9 grep)
