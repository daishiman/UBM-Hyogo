# Phase 6 — failure cases 表

## 軸 1: D1 由来失敗

| ID | ケース | 期待 | 実装での扱い | テスト |
| --- | --- | --- | --- | --- |
| F-1 | 存在しない email を `findByEmail` | null | `first()` が null | adminUsers.test.ts |
| F-2 | 存在しない id を `update` / `remove` | null / false | `meta.changes === 0` 判定 | adminNotes.test.ts |
| F-3 | `auditLog.append` の D1 接続失敗 | throw | repository は throw、04c 側で catch | E2E は 04c で扱う |
| F-4 | `sync_jobs.metrics_json` に巨大 JSON | 保存可、警告は Phase 9 | 例外なし | （Phase 9 監視） |
| F-5 | `magic_tokens.expires_at` parse 失敗 | 比較で expired 扱い | `new Date(s).getTime() < now` | magicTokens.test.ts |
| F-6 | `admin_member_notes.body` 空文字 | repository 素通し、04c で zod 422 | repository 制約なし | （Phase 04c） |

## 軸 2: 認可境界違反（不変条件 #5 / #11 / #12）

| ID | ケース | 期待 | 実装での扱い | テスト |
| --- | --- | --- | --- | --- |
| A-1 | apps/web から `import { findByEmail } from "@ubm-hyogo/api/repository/adminUsers"` | lint-boundaries で exit 1 | scripts/lint-boundaries.mjs `@ubm-hyogo/api` 禁止トークン | apps/web/.../boundary.test.ts |
| A-2 | apps/web から `import type { D1Database }` | lint-boundaries で exit 1 | `D1Database` 禁止トークン | 同上 |
| A-3 | 02a `responses.ts` → 02c `auditLog.ts` import | dependency-cruiser `repo-no-cross-domain-2c-to-2a` で violation | `.dependency-cruiser.cjs` rule 配置済み | （02a 完了時 CI で検出） |
| A-4 | adminNotes が PublicMemberProfile に混入 | 型 error | view model 型に不在 | adminNotes.test.ts (AC-2 type check) |

## 軸 3: sync ジョブ事故

| ID | ケース | 期待 | 実装での扱い | テスト |
| --- | --- | --- | --- | --- |
| S-1 | `succeeded` 状態に対して `fail()` | throw `IllegalStateTransition` | `assertTransition` で防止 | syncJobs.test.ts |
| S-2 | `failed` 状態に対して `succeed()` | throw `IllegalStateTransition` | 同上 | 同上 |
| S-3 | 存在しない job_id に対して状態遷移 | throw `SyncJobNotFound` | `assertTransition` で先に存在チェック | 同上 |
| S-4 | 並行 `start` / `succeed` 競合 | 楽観 lock 不要（job_id は UUID で衝突なし） | 単純 INSERT/UPDATE | （シングルライターで運用） |

## 軸 4: 認証 / token 事故

| ID | ケース | 期待 | 実装での扱い | テスト |
| --- | --- | --- | --- | --- |
| T-1 | 同一 token を 2 回 consume | 2 回目は `{ ok: false, reason: "already_used" }` | 楽観 lock `WHERE used = 0`、`meta.changes === 0` 判定 | magicTokens.test.ts AC-7 |
| T-2 | expired token を consume | `{ ok: false, reason: "expired" }` | `expiresAt < now` で判定 | 同上 |
| T-3 | 未知 token を consume | `{ ok: false, reason: "not_found" }` | `findByToken` が null | 同上 |
| T-4 | expired token を verify | null | 同上 | 同上 |
| T-5 | 並行 consume race condition | 1 件のみ ok | `WHERE used = 0` の atomic UPDATE | 構造で保証（test 化困難） |

## 軸 5: append-only 不変条件

| ID | ケース | 期待 | 実装での扱い |
| --- | --- | --- | --- |
| AO-1 | `auditLog.update(...)` を呼ぶ | TS error（関数不在） | `auditLog.ts` から export しない |
| AO-2 | `auditLog.delete(...)` を呼ぶ | TS error | 同上 |
| AO-3 | `auditLog.remove(...)` を呼ぶ | TS error | 同上 |

これらは `auditLog.test.ts` の `// @ts-expect-error` で構造的に検証。
