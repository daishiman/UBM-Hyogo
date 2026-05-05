# manual-smoke-log — task-05a-form-preview-503-001

## 必須メタ

| 項目 | 値 |
| --- | --- |
| 証跡の主ソース | curl HTTP status / JSON shape / focused Vitest |
| screenshot を作らない理由 | NON_VISUAL。API endpoint HTTP status verification で AC が完結するため |
| 実行日時 | 2026-05-05（review 実測） |
| 実行者 / branch | implementation cycle / `task-20260505-092049-wt-6` |

## smoke log

| AC | 実行コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 staging API 200 | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` | `200` | **503** | BLOCKED → D1 active manifest required |
| AC-1 JSON shape | `curl -s https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview \| jq '{ formId: .manifest.formId, fieldCount, sectionCount }'` | manifest 等を取得できる | 503 のため未取得 | BLOCKED → D1 active manifest required |
| AC-2 production API 200 | `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-api.daishimanju.workers.dev/public/form-preview` | `200` | **503** | BLOCKED → production D1 verification/user approval required |
| AC-3 staging `/register` 200 | `curl -s -o /dev/null -w "%{http_code}\n" https://<web-staging-domain>/register` | `200` | 未実行 | BLOCKED → API 200 後に確認 |
| AC-4 focused Vitest | `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` | all PASS | **17/17 PASS / latest review rerun 5.77s** | **GO** |
| AC-4 coverage | `--coverage --coverage.include='apps/api/src/use-cases/public/get-form-preview.ts'` | Stmts/Branch/Funcs/Lines ≥85%/80%/85%/85% | **100/100/100/100** | **GO** |

## 判定ルール

- `PENDING_RUNTIME_EVIDENCE` は PASS ではない。
- 2026-05-05 review では public HTTPS curl は実行でき、staging / production はともに 503。Cloudflare D1 write / deploy / production mutation は user approval gate 外では実行しない。
- staging D1 write、production mutation、deploy、commit、push、PR は user approval gate 外では実行しない。
- secret / token / `.env` 実値を本ログに転記しない。

## sandbox 実行制約と DEFER 判定の根拠

本 implementation cycle は次の制約下で動作する:

1. Cloudflare API Token / Workers OAuth トークンへのアクセス権がない（`scripts/cf.sh` の `op run` が依存する 1Password セッションが sandbox には無い）。
2. ネットワークレイヤから staging / production の Workers domain へ HTTPS POST/GET を発行する経路がない。
3. commit / push / PR は本タスクで明示的に禁止。

このため AC-1〜AC-3 は **runtime evidence blocked** とする。Phase 5/6 で route 層 503 mapping と use-case 200/503 分岐は test で固定済みだが、staging / production の 200 判定には D1 `schema_versions.state='active'` の実データ確認と user-approved operation が必要。
