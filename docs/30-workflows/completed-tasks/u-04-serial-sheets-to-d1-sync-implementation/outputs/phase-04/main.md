# Phase 4 成果物: テスト戦略（u-04 sheets-to-d1-sync-implementation）

> 状態: completed
> 入力: phase-01/main.md, phase-02/{sync-module-design,audit-writer-design,d1-contract-trace,cron-config}.md, phase-03/main.md
> 出力: outputs/phase-04/main.md, outputs/phase-04/test-matrix.md

## 1. verify suite（4 layer 行列）

| layer | tool | scope | 期待件数 |
| --- | --- | --- | --- |
| unit | vitest | audit.ts (startRun / finishRun / failRun / skipRun / listRecent) | 8 |
| unit | vitest | mapping.ts (mapBasicProfile / mapUbmProfile / mapPersonalProfile / mapSocialLinks / mapMessage / mapConsent / collectExtras / parseTimestamp / normalizeEmail) | 12 |
| unit | vitest | mutex.ts (acquire / release / race) | 4 |
| unit | vitest | upsert.ts (member_responses / member_identities / member_status) | 6 |
| unit | vitest | sheets-client.ts (JWT 署名 / fetch / backoff) | 5 |
| contract | vitest + d1-fake | data-contract.md mapping table 1:1 | 31 |
| contract | vitest + d1-fake | sync-flow.md §1〜§5 sequence | 6 |
| integration | vitest + d1-fake | manual / scheduled / backfill × audit finalize | 9 |
| integration | vitest + d1-fake | retry/backoff (rate limit 429) | 3 |
| integration | vitest + d1-fake | scheduled E2E (handler 呼び出し → audit row) | 2 |
| static | grep / ESLint | googleapis 禁止 / node: 禁止 / stableKey 直書き禁止 / apps/web → sync 禁止 | 4 |

## 2. TDD 順序（audit 先行）

| order | 対象 | green 条件 |
| --- | --- | --- |
| 1 | `audit.ts` | U-A-01〜U-A-08 |
| 2 | `mapping.ts` (re-export from jobs/mappers) | U-M-01〜U-M-12 + C-D-01〜C-D-31 |
| 3 | `upsert.ts` | unit 6 件 |
| 4 | `mutex.ts` | unit 4 件 + I-06 |
| 5 | `sheets-client.ts` | unit 5 件 + I-08/I-09 |
| 6 | `manual.ts` | I-01/I-02 + C-F-01 |
| 7 | `scheduled.ts` | I-03/I-07 + C-F-02 |
| 8 | `backfill.ts` | I-04 + C-F-03 + S-05 |
| 9 | `index.ts` | E2E |

## 3. TECH-M / Q マトリクス

| ID | 検証 ID | 解決 Phase |
| --- | --- | --- |
| TECH-M-01 (mutex race) | I-06 / mutex unit | 5/6 |
| TECH-M-02 (同秒取りこぼし) | I-07 | 5/6 |
| TECH-M-03 (running 漏れ) | U-A-08 / I-09 | 5/6 |
| TECH-M-04 (shared 化) | Phase 12 持越 | 12 |
| TECH-M-05 (列追加待ち) | flag 駆動 audit writer | 5/8 |
| TECH-M-06 (POST /admin/sync 互換) | 互換 mount 維持 | 12 |

## 4. 不変条件 trace

- #1 stableKey 直書き禁止 → S-04 (ESLint) + U-M-11
- #2 consent 統一 → U-M-08〜U-M-10, U-M-12
- #3 responseEmail = system → U-M-02
- #4 admin 列分離 → I-04 + S-05 (grep)
- #5 apps/web → D1 禁止 → S-03
- #6 Workers 互換 → S-01, S-02
- #7 Sheets を真として backfill → C-F-04 / I-04

## 5. 完了確認

- [x] AC-1〜AC-12 が test ID と対応 (test-matrix.md 参照)
- [x] 4 layer 定義
- [x] AC-7 / AC-8 / AC-9 / AC-10 / AC-12 の static + integration 含む
- [x] TDD 順序が audit 先行
- [x] TECH-M-01〜04 / Q1〜Q6 に検証 ID 割当
