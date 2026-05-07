# Phase 6: seed / cleanup スクリプト実装

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-6/phase-6.md` |
| 変更対象 | `scripts/schema-alias-backfill/seed-staging-50k.sh`（新規）, `scripts/schema-alias-backfill/cleanup-staging-50k.sh`（新規） |

## 目的
Phase 3 で確定した CLI I/F に従い、staging-only の bulk INSERT スクリプトと cleanup スクリプトを bash で実装する。production guard を二重に実装する。

## 実行タスク
1. `seed-staging-50k.sh` 実装:
   - shebang: `#!/usr/bin/env bash` + `set -euo pipefail`
   - 引数 parse: `--env`, `--fixture-file`, `--dry-run`
   - **production guard 1**: `[[ "$ENV" != "staging" ]] && { echo "ERROR: --env must be 'staging' (got: $ENV)" >&2; exit 1; }`
   - **production guard 2**: `[[ "${CLOUDFLARE_ENV:-}" == "production" ]] && { echo "ERROR: CLOUDFLARE_ENV=production blocked" >&2; exit 1; }`
   - dry-run: SQL を stdout に出力して終了
   - apply: `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote --file "$FIXTURE_FILE"` を呼ぶ
2. `cleanup-staging-50k.sh` 実装:
   - 同 guard を両方実装
   - `--confirm` フラグなしの場合は dry-run（stdout に DELETE 文表示）
   - apply: `scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote --command "DELETE FROM schema_diff_queue WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%'"`
   - cleanup selector は Phase 2 の prefix付き `dedupe_key` と同じ集合を選ぶ。hash-only key は禁止。
3. shellcheck SC0/lint clean を確認。

## ローカル実行・検証コマンド
```bash
shellcheck scripts/schema-alias-backfill/seed-staging-50k.sh
shellcheck scripts/schema-alias-backfill/cleanup-staging-50k.sh
bash scripts/schema-alias-backfill/seed-staging-50k.sh --env production 2>&1; echo "exit=$?"  # 期待: exit=1
bash scripts/schema-alias-backfill/seed-staging-50k.sh --env staging --fixture-file /tmp/fixture-50k.sql --dry-run | head -5
```

## 統合テスト連携
Phase 4 で設計した TC-SEED-01〜04 を満たす。

## 参照資料
- `outputs/phase-3/cli-spec.md`
- `scripts/cf.sh`

## 成果物
- `scripts/schema-alias-backfill/seed-staging-50k.sh`
- `scripts/schema-alias-backfill/cleanup-staging-50k.sh`
- `outputs/phase-6/phase-6.md`

## 完了条件 (DoD)
- shellcheck clean（SC0）
- `--env production` / `CLOUDFLARE_ENV=production` で即時 exit 1
- TC-SEED-01〜04 PASS
- production への INSERT / DELETE が構造上不可能（grep で `--env production` の通り道がないことを確認）
- seed count と cleanup count が同一 selector `dedupe_key LIKE 'ubm-test-fixture-50k-%'` で 50000 → 0 に遷移する
