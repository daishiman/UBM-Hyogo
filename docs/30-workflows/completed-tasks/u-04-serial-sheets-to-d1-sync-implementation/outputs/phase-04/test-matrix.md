# test-matrix.md（u-04 AC × test ID + TECH-M / Q × 検証）

## 1. unit test 行列

### audit.ts (U-A-XX)

| ID | 入力 | 期待 |
| --- | --- | --- |
| U-A-01 | `startRun({trigger:'manual'})`、running 行なし | row INSERT, acquired=true |
| U-A-02 | `startRun({trigger:'scheduled'})`、既存 running 行 | acquired=false, INSERT なし |
| U-A-03 | `startRun({trigger:'backfill'})` | UUID auditId |
| U-A-04 | `finishRun(id, {fetched, upserted, ...})` | UPDATE → status=success |
| U-A-05 | `failRun(id, 'sheets_rate_limit')` | UPDATE → status=failed, errorReason 記録 |
| U-A-06 | `finishRun(id)` を再呼び出し（既に finalize 済） | conflict（更新行 0 件） |
| U-A-07 | DB error 発生時の startRun | throw |
| U-A-08 | `withSyncMutex` ループ内で例外 | running → failed（finally 経路） |

### mapping.ts (U-M-XX)

| ID | 対象 | 入力 | 期待 |
| --- | --- | --- | --- |
| U-M-01 | parseTimestamp | `2026/04/30 12:34:56` | ISO 文字列 |
| U-M-02 | normalizeEmail | `  Foo@Example.COM ` | `foo@example.com` |
| U-M-03 | mapBasicProfile | 6 列 | answers_json 6 stableKey |
| U-M-04 | mapUbmProfile | ubmZone enum | enum 検証 |
| U-M-05 | mapPersonalProfile | 4 列 | 4 stableKey |
| U-M-06 | mapSocialLinks | 11 URL | 11 stableKey、空は省略 |
| U-M-07 | mapMessage | self 紹介 | 1 stableKey |
| U-M-08 | mapConsent | "同意する" | "consented" |
| U-M-09 | mapConsent | "同意しない" | "declined" |
| U-M-10 | mapConsent | "" / 未知値 | "unknown" |
| U-M-11 | collectExtras | 未知 questionId | extra_fields_json + unmapped_question_ids_json |
| U-M-12 | mapConsent | 表記揺れ "Public Consent" | unmapped または正規化 |

### upsert.ts / mutex.ts / sheets-client.ts

| ID | 対象 | 期待 |
| --- | --- | --- |
| U-U-01 | upsert member_responses | row 反映 |
| U-U-02 | upsert member_identities (UPSERT) | response_email 反映 |
| U-U-03 | upsert member_status (consent 列のみ) | publish_state 等 admin 列に触らない |
| U-U-04 | 連続 2 回 upsert (同 responseId) | 冪等 |
| U-U-05 | 空配列 | no-op |
| U-U-06 | NULL 列 | bind null |
| U-X-01 | mutex acquire 成功 | sync_locks row INSERT |
| U-X-02 | mutex acquire 競合 | null |
| U-X-03 | mutex release | row DELETE |
| U-X-04 | mutex stale TTL | 古い row が削除されてから INSERT |
| U-S-01 | sheets-client JWT 署名 | base64url 構成 |
| U-S-02 | sheets-client fetchRange 200 | values 配列 |
| U-S-03 | sheets-client 401 / 4xx | throw |
| U-S-04 | sheets-client backoff 429 | retry → 成功 |
| U-S-05 | sheets-client backoff 上限 | throw RateLimitError |

## 2. contract test (C-D / C-F)

| ID | golden 入力 | 期待 |
| --- | --- | --- |
| C-D-01..31 | data-contract.md §3.1/§3.2 31 stableKey | mapping.ts 出力差分 0 |
| C-F-01 | sync-flow.md §1 manual | audit running → success |
| C-F-02 | §2 scheduled delta | submittedAt フィルタ |
| C-F-03 | §3 backfill | admin 列 untouched |
| C-F-04 | §4 recovery | last_success 復元 |
| C-F-05 | §5 audit | row が trigger / counts / status を保持 |
| C-F-06 | UT-01 sync-log §9 | sync_audit ↔ sync_job_logs 対応 |

## 3. integration (I-XX)

| ID | シナリオ | 検証 | AC |
| --- | --- | --- | --- |
| I-01 | manual POST /admin/sync/run + Bearer 正 | 200 + auditId, audit success | AC-2 / AC-5 |
| I-02 | manual Bearer 不正 | 401 | AC-2 |
| I-03 | scheduled() 起動 | sync_audit success | AC-3 / AC-5 |
| I-04 | backfill | member_responses 全件 reload, admin 列 不変 | AC-4 |
| I-05 | 同 responseId 二重 upsert | 冪等 | AC-6 |
| I-06 | running 中 manual | 409 + sync_in_progress | AC-7 |
| I-07 | scheduled 同秒 2 行 | 両件 upsert | TECH-M-02 |
| I-08 | sheets 429 → backoff → success | finish success | AC-12 |
| I-09 | sheets 429 → backoff 超過 | failed + reason | AC-12 / TECH-M-03 |

## 4. static (S-XX)

| ID | check | 期待 |
| --- | --- | --- |
| S-01 | `grep "googleapis" apps/api/src/sync` | 0 |
| S-02 | `grep "node:" apps/api/src/sync` | 0 |
| S-03 | `grep "apps/api/src/sync" apps/web/src` | 0 |
| S-04 | ESLint stableKey 直書き | error 0 |
| S-05 | `grep "publish_state\|is_deleted\|meeting_sessions" apps/api/src/sync/{manual,scheduled,backfill}.ts` | 0 |

## 5. AC × test ID マスタ

| AC | unit | contract | integration | static |
| --- | --- | --- | --- | --- |
| AC-1 | - | - | - | S-03 |
| AC-2 | - | C-F-01 | I-01, I-02 | - |
| AC-3 | - | C-F-02 | I-03 | - |
| AC-4 | U-U-03 | C-F-03 | I-04 | S-05 |
| AC-5 | U-A-01..08 | C-F-05 | I-01..04, I-09 | - |
| AC-6 | U-U-04 | - | I-05 | - |
| AC-7 | U-X-01..04 | - | I-06 | - |
| AC-8 | U-M-01..12 | C-D-01..31 | - | S-04 |
| AC-9 | - | - | - | S-03 |
| AC-10 | - | - | - | S-01, S-02 |
| AC-11 | U-M-08..10, U-M-12 | C-D-30, C-D-31 | - | - |
| AC-12 | U-S-04, U-S-05 | - | I-08, I-09 | - |
