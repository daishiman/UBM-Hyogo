# Phase 8 サマリ: 品質保証

## 目的

Phase 5 で実装し Phase 6 で異常系を検証した sync layer に対し、typecheck / test / 静的検査 / 不変条件 / security / 無料枠を一括ゲートし、Phase 9 リファクタリング進入の GO 判定を行う。

## 1. 静的解析ゲート結果

### typecheck

```
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

結果: PASS (`tsc -p tsconfig.json --noEmit` error 0)。

### import boundary / Workers 互換性

| check | 結果 |
| --- | --- |
| `git grep -nE "from ['\"]googleapis['\"]" apps/api` | 0 件 |
| `git grep -nE "from \"node:" apps/api/src/sync` | 0 件 |
| `git grep -nE "apps/api/src/sync" apps/web/src` | 0 件 (apps/web 経由禁止) |
| `git grep -rE "publish_state\|is_deleted\|hidden_reason\|meeting_sessions" apps/api/src/sync/{manual,scheduled,backfill}.ts` | 0 件 (admin 列 untouched) |

## 2. 自動テストゲート結果

### 実行コマンド

```
mise exec -- pnpm exec vitest run apps/api/src/sync
```

### 結果

```
Test Files  11 passed (11)
     Tests  43 passed (43)
   Duration  39.81s
```

内訳:

| ファイル | tests | 状態 |
| --- | --- | --- |
| `apps/api/src/sync/audit.test.ts` | 7 | PASS (U-A-01..03, U-X-01..03, U-A-08) |
| `apps/api/src/sync/audit-route.test.ts` | 3 | PASS (I-08, I-09, 401) |
| `apps/api/src/sync/manual.test.ts` | 3 | PASS (I-01) |
| `apps/api/src/sync/backfill.test.ts` | 1 | PASS (I-07: admin 列不変) |
| `apps/api/src/sync/scheduled.test.ts` | 3 | PASS (I-04, I-05, I-06) |
| `apps/api/src/sync/sheets-client.test.ts` | 5 | PASS (U-S-01..05) |
| `apps/api/src/sync/schema/*.test.ts` (既存 03a) | 21 | PASS (regression OK) |

### AC 充足

- AC-1〜AC-3 (endpoints): manual / backfill / scheduled 全 PASS
- AC-4 (audit): U-A-01..03 / U-X-01..03 PASS
- AC-5 (mutex): U-X-03 PASS
- AC-7 (audit GET): I-08 / I-09 PASS
- AC-8 (Bearer 認証): I-02 / 401 ケース PASS
- AC-9 (PII redact): U-X-02 PASS
- AC-10 (admin 列保護): I-07 PASS
- AC-11 (no googleapis SDK): grep gate + sheets-client unit PASS
- AC-12 (backoff): U-S-02 / U-S-03 / U-S-05 PASS

## 3. security review

| # | チェック | 結果 |
| --- | --- | --- |
| S-01 | Service Account JSON 値の repo 混入なし | OK (`git grep "BEGIN PRIVATE KEY"` 0 件) |
| S-02 | refresh_token / client_secret なし | OK |
| S-03 | D1 binding (DB) は env 経由のみ | OK |
| S-04 | wrangler 直呼び出しが docs/runbook に無い | runbook は `bash scripts/cf.sh` のみ |
| S-05 | Sheets JWT を Workers で生成しキャッシュなし | OK (sheets-client.ts は fetch ごと再発行) |
| S-06 | audit row error_reason は redact 済み | OK (`audit.ts:redact` で email mask + 1000 文字 cap) |
| S-07 | Bearer 比較は timing-safe | OK (`require-sync-admin.ts:timingSafeEqual`) |

## 4. 不変条件チェック

| 不変条件 | 確認 | 結果 |
| --- | --- | --- |
| #1 schema コード固定回避 | mapping.ts は jobs/mappers re-export、stableKey は jobs/mappers 内のみ | PASS |
| #2 consent 統一 | mapConsent は publicConsent / rulesConsent を `consented`/`declined`/`unknown` に正規化 | PASS |
| #3 responseEmail = system | normalizeEmail で trim + lowercase | PASS |
| #4 admin 列分離 | I-07 backfill test で `member_status.publish_state` / `is_deleted` 不変を実証 | PASS |
| #5 apps/web → D1 禁止 | grep 0 件 | PASS |
| #6 Workers 互換 (no googleapis / no node:) | grep 0 件、JWT は crypto.subtle 経由 | PASS |
| #7 Sheets を真として backfill | backfill 実装が DELETE → INSERT batch | PASS |

## 5. 無料枠 / D1 writes

| 項目 | 想定 | 無料枠 | 結論 |
| --- | --- | --- | --- |
| Workers req | 24/day (cron) + 数件 manual | 100,000/day | OK |
| Workers CPU time | < 50ms 想定 | 10ms (free) / 50ms (paid) | 実測は Phase 11 で確認 |
| D1 writes | 数百〜数千/day | 100,000/day | OK |
| D1 reads | 数千/day | 5,000,000/day | OK |
| Cron Trigger 数 | 3 (u-04 + 03a + 03b) | 5/account | OK |
| Sheets API | 24 req/h | 60/min/user | OK |

## 6. blocker / minor 仕分け

| 種別 | ID | 内容 | 引き継ぎ先 |
| --- | --- | --- | --- |
| blocker | - | なし (typecheck PASS / test 43 PASS) | - |
| MINOR | Q-M-01 | mapping.ts は jobs/mappers re-export のまま (Phase 9 で物理移動) | Phase 9 |
| MINOR | Q-M-02 | upsert.ts のコメントで member_status consent 同期未対応を明記 (別 wave 担当) | (現状維持) |
| MINOR | Q-M-03 | CPU time 実測は Phase 11 sanity で確認 | Phase 11 |
| MINOR | TECH-M-04 | shared 化判断は Phase 12 に持越 | Phase 12 |

## 結論: GO

Phase 9 リファクタリング進入条件:

- typecheck error 0
- test 43 PASS
- 不変条件 #1〜#7 全 PASS
- security review S-01〜S-07 OK
- blocker 0

→ 全条件充足。Phase 9 へ進む。
