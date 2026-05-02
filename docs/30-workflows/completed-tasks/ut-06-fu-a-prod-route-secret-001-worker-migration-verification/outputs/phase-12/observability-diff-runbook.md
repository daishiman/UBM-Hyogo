# observability-diff runbook (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 連携)

親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 の手動 observability 確認手順を、機械検証で補完する追加 runbook。

## 目的

`ubm-hyogo-web-production` (新 Worker) と `ubm-hyogo-web` (旧 Worker) の observability target (Workers Logs / Tail / Logpush / Analytics Engine) の差分を read-only で出力する。

## 実行コマンド

```bash
bash scripts/observability-target-diff.sh \
  --current-worker ubm-hyogo-web-production \
  --legacy-worker  ubm-hyogo-web \
  --config apps/web/wrangler.toml
```

オプション:
- `--format md|json` (default: `md`)
- `--no-color`
- `OBS_DIFF_FETCH_LOGPUSH=1` を環境変数で渡すと cf.sh 経由で Logpush の取得を試行 (default は dashboard fallback)

## 期待出力 (md)

```
# observability-target-diff
- legacy:  ubm-hyogo-web
- current: ubm-hyogo-web-production

## R1 Workers Logs
- current: enabled=true head_sampling_rate=1.0
- legacy:  N/A (dashboard fallback: Workers & Pages → ubm-hyogo-web → Logs)

## R2 Tail
- current: target=ubm-hyogo-web-production
- legacy:  target=ubm-hyogo-web

## R3 Logpush
- current: N/A (dashboard fallback: Analytics & Logs → Logpush for ubm-hyogo-web-production)
- legacy:  N/A (dashboard fallback: Analytics & Logs → Logpush for ubm-hyogo-web)

## R4 Analytics Engine
- current: bindings=[] datasets=[]
- legacy:  bindings=[] # ubm-hyogo-web (legacy)

## Diff summary
- legacy-only:  0
- current-only: 1
```

詳細サンプル: `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-11/diff-sample.md`

## exit code

| code | 意味 | 対応 |
| --- | --- | --- |
| 0 | 一致 (差分なし、または plan 制限の N/A 同士) | 追加対応不要 |
| 1 | 差分あり (新旧 Worker のいずれかにのみ target が紐付いている) | 出力の `Diff summary` を確認し、運用判断 |
| 2 | API 失敗 / network / config 不在 | `bash scripts/cf.sh whoami` で認証確認 |
| 3 | 認証失敗 | 1Password の `CLOUDFLARE_API_TOKEN` 期限を確認 |
| 64 | 引数不正 | `--current-worker` / `--legacy-worker` 両方の指定を確認 |

## redaction 不変条件

- token / secret / sink URL credential / dataset write key / OAuth token は **stdout / stderr に一切出力されない**
- 出力許可: Worker 名 / dataset 名 / URL の host 部 / enabled flag / job 名 / filter 概要のみ

## トラブルシュート

| 症状 | 対応 |
| --- | --- |
| exit 2 | `bash scripts/cf.sh whoami` で API Token 注入を確認 |
| exit 3 | 1Password 側の token 期限を確認 |
| `N/A (dashboard fallback: ...)` 多発 | Cloudflare plan 制限の可能性。dashboard で確認 |
| 出力に token-like 文字列が見える | redaction module (`scripts/lib/redaction.sh`) のバグ。ただちに `tests/unit/redaction.test.sh` を再実行し PR を出さない |

## 関連

- 起源 spec: `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md`
- タスク仕様書: `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/`
- 親タスク runbook: 本ファイルの隣接 (`outputs/phase-XX/*.md`)
- 実装: `scripts/observability-target-diff.sh` / `scripts/lib/redaction.sh`
- テスト: `tests/unit/redaction.test.sh` / `tests/integration/observability-target-diff.test.sh`
