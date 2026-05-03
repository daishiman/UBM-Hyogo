# Phase 6: 異常系検証 — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 6 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |

## 目的

`fetchPublic` の service-binding 経路統一に伴い、staging / production / local で
発生しうる異常系を網羅的に列挙し、各々の検出条件・recover 手順・evidence 化方針を確定する。

## 実行タスク

1. `env.API_SERVICE` undefined ケースの分岐妥当性確認
2. service-binding 経路で 5xx / 4xx を返した場合の切り分け
3. cookie / Authorization 伝搬欠落時の症状確認
4. local `pnpm dev` での `PUBLIC_API_BASE_URL` 未設定エラー
5. wrangler.toml の `service` 名 typo 時のエラー切り分け
6. PII / token 露出時の即時停止 / redaction ルール

## 参照資料

- docs/30-workflows/ut-05a-fetchpublic-service-binding-001/phase-05.md
- apps/web/src/lib/fetch/public.ts
- apps/web/wrangler.toml
- scripts/cf.sh

## 異常系一覧

### service-binding 経路系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| `env.API_SERVICE` undefined（staging/production） | tail log に `transport: 'http-fallback'` 等が出る、または curl 200 にならない | wrangler.toml の `[[env.*.services]]` 確認、deploy 再実行、AC-2 evidence 更新 |
| service-binding 経由 5xx | `fetchPublic failed: <path> 5xx` throw → `/` `/members` 500 | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env <env>` で API 側原因切り分け |
| service-binding 経由 404 | `FetchPublicNotFoundError` throw | route 仕様 / API path mismatch 確認 |
| cookie / Authorization 伝搬欠落 | session 切れ symptom（公開 path には影響軽微） | `binding.fetch` の `init.headers` 透過確認、必要に応じ `auth.ts` パターンに合わせる |

### local dev / fallback 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` 未設定 | localhost で `http://localhost:8787` への接続失敗 | `.dev.vars` に `PUBLIC_API_BASE_URL` を設定、再起動 |
| HTTP fallback 経路 regression | local `/` `/members` が 200 にならない | doFetch の binding 分岐ガード確認、ユニットテスト Layer 1 を再実行 |
| `getCloudflareContext()` throw（local） | `readEnv()` が `{}` を返し、`process.env.PUBLIC_API_BASE_URL` に fallback | 仕様通り。動作異常ではない |

### wrangler.toml / deploy 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| `service` 名 typo | deploy 時 `Service Worker not found` または runtime 500 | `[[env.*.services]].service` を `ubm-hyogo-api-staging` / `ubm-hyogo-api` に修正 |
| `binding` 名 typo | コード側 `env.API_SERVICE` が undefined → fallback 経路に落ちる | `binding = "API_SERVICE"` 厳守 |
| env block 抜け | staging のみ動作、production 500 | `[[env.production.services]]` の存在確認 |

### tail / observability 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| tail 接続不能 | `bash scripts/cf.sh tail` がエラー終了 | 取得不能理由を `wrangler-tail-staging.log` 冒頭に記録、AC-5 は partial PASS 扱い |
| `transport: 'service-binding'` 観測されず | tail log に `http-fallback` のみ | binding 設定 / deploy build 反映確認、再 deploy |

### Secret / 個人情報

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| secret 不足 | `bash scripts/cf.sh whoami` 失敗 | 即時中止 → `.env` の op:// 参照確認 |
| log に Bearer token | tail log に `Authorization: Bearer ...` | log 全体破棄 → redaction 後に再取得 |
| screenshot に個人情報 | curl/log に email / 氏名 | 即時削除 → redaction 後に再取得 |

## 多角的チェック観点

- 異常系を「失敗」ではなく「evidence 化対象」として扱う
- 個人情報露出時は AC PASS / FAIL 判定より優先で停止する
- service-binding 経路と HTTP fallback 経路を **両方とも** 観測対象にする（fallback 経路の局所 regression を見落とさない）

## 統合テスト連携

Phase 11 runtime smoke で BLOCKED / FAIL が発生した場合、本 Phase の異常系分類に従って `manual-smoke-log.md` と該当 evidence file の冒頭へ原因を記録する。分類不能な失敗は AC を PASS にせず、Phase 12 compliance check に `EXECUTED_BLOCKED` として同期する。

## サブタスク管理

- [ ] 各異常系の検出条件と evidence 化フォーマットを記述
- [ ] AC への影響を case 単位で記述（AC-3〜AC-5 が主に影響）
- [ ] 個人情報露出時の即時停止フローを記述
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- service-binding / fallback / wrangler.toml / tail / secret / PII の異常系が網羅されている
- 各 case の evidence 化と再実行条件が定義されている
- AC への影響が case 単位で記述されている

## タスク100%実行確認

- [ ] 異常系を PASS と誤認するルートが残っていない
- [ ] PII 露出時の停止が他判定より優先されている

## 次 Phase への引き渡し

Phase 7 へ、AC マトリクスの前提（異常系含む）を渡す。
