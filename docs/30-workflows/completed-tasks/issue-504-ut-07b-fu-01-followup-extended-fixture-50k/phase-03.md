# Phase 3: スクリプト I/F 設計（generate / seed / cleanup / run-stress-trial）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-3/phase-3.md` |

## 目的
4 つのスクリプトの CLI I/F・入出力・副作用・終了コード仕様を確定する。

## 実行タスク
1. `generate-50k-fixture.ts` I/F 確定:
   - 引数: `--count <n>`（default 50000）, `--output <path>`（default stdout）, `--format sql|json`（default sql）
   - 副作用: stdout / file write のみ。D1 への書き込み一切なし。
   - 終了コード: 0=成功 / 1=引数エラー / 2=write エラー
2. `seed-staging-50k.sh` I/F 確定:
   - 引数: `--env staging`（必須・他値は abort）, `--fixture-file <path>`, `--dry-run`
   - 副作用: `scripts/cf.sh d1 execute --env staging` 経由で D1 INSERT
   - production guard: `--env production` または `$CLOUDFLARE_ENV=production` で即時 exit 1
3. `cleanup-staging-50k.sh` I/F 確定:
   - 引数: `--env staging`（必須）, `--confirm`
   - 副作用: `DELETE FROM schema_diff_queue WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%'` 相当
4. `run-stress-trial.sh` I/F 確定:
   - 引数: `--trials <n>`（default 10）, `--evidence-out <path>`
   - 副作用: trial 毎に back-fill 発火、retry_count / cpu_ms / queue_enqueued / dlq_count / backfill_status を JSON で append
5. evidence JSON schema を `outputs/phase-3/evidence-schema.json` に確定。

## 統合テスト連携
Phase 4 bats で各スクリプトの引数バリデーション / production abort / dry-run 出力決定論性を検証。

## 参照資料
- `outputs/phase-1/phase-1.md`
- `outputs/phase-2/phase-2.md`
- `scripts/cf.sh`

## 成果物
- `outputs/phase-3/phase-3.md`
- `outputs/phase-3/cli-spec.md`
- `outputs/phase-3/evidence-schema.json`

## 完了条件
- 4 スクリプトの引数 / 終了コード / 副作用が SSOT として確定。
- evidence JSON schema が確定。
- production guard の二重ガード仕様が明記。
