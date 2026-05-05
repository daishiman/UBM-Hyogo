# Phase 6: 異常系検証 — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

本 Phase は実装済みコードの異常系挙動と検証手順を CONST_005 形式で確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 6 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | implementation-complete |
| 上流 | Phase 5 実装ランブック |
| 下流 | Phase 7 AC マトリクス |

## 目的

`POST /admin/identity-conflicts/:id/merge` および `/dismiss` の failure case を、実装側の例外型・HTTP code 翻訳・テスト網羅と完全整合した形で確定する。merge transaction 中断時のリカバリ runbook も併記する。

## 参照資料

- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- apps/api/src/middleware/require-admin.ts
- apps/api/src/repository/identity-merge.ts
- apps/api/src/repository/identity-conflict.ts
- apps/api/src/routes/admin/identity-conflicts.ts
- apps/api/src/repository/__tests__/identity-merge.test.ts
- apps/api/src/repository/__tests__/identity-conflict.test.ts

## failure cases（実装と完全整合）

| # | 条件 | 例外 / 検出箇所 | HTTP | エラー code | 検証 |
| -- | --- | --- | --- | --- | --- |
| 1 | session 不正 / 未ログイン | `requireAdmin` middleware 第一段で reject | 401 | `UNAUTHENTICATED` | 既存 `require-admin` 系 test |
| 2 | session 有効だが admin role なし | `requireAdmin` が role 判定で reject | 403 | `FORBIDDEN` | 既存 middleware test |
| 3 | conflictId フォーマット不正 (`__` 区切り欠落 / 空) | `parseConflictId` が null 返却 → route 400 | 400 | `BAD_CONFLICT_ID` | `identity-conflict.test.ts > parseConflictId > 不正フォーマットは null` |
| 4 | merge body の zod parse 失敗（reason 1 文字未満 / 500 超 / targetMemberId 欠落） | `MergeIdentityRequestZ.safeParse` failure | 400 | `BAD_REQUEST` | route handler 内分岐（手動検証） |
| 5 | merge body の `targetMemberId` と path 由来 target が不一致 | route 専用 guard | 400 | `TARGET_MEMBER_MISMATCH` | route handler 内分岐（手動検証） |
| 6 | source == target | `MergeSelfReference` | 400 | `SELF_REFERENCE` | `identity-merge.test.ts > source == target は MergeSelfReference` |
| 7 | source または target の `member_identities` 不在 | `MergeIdentityNotFound` | 404 | `MEMBER_NOT_FOUND` | `identity-merge.test.ts > source 不在は MergeIdentityNotFound` |
| 8 | 二重 merge（同一 source が既に `identity_aliases` 登録済） | `MergeConflictAlreadyApplied`（事前チェック / batch UNIQUE 失敗の翻訳） | 409 | `ALREADY_MERGED` | `identity-merge.test.ts > 二重 merge は MergeConflictAlreadyApplied` |
| 9 | dismiss 重複 | `INSERT ... ON CONFLICT(source, candidate_target) DO UPDATE` で upsert（reason / dismissed_by 上書き） | 200 | — | `identity-conflict.test.ts > dismiss 後は候補から除外される` |
| 10 | reason に email / 電話を含む | `redactReason` で `[redacted]` 置換 | 200 | — | `identity-merge.test.ts > PII redaction` |
| 11 | D1 batch 内の任意 INSERT 失敗 | `db.batch()` 全文 atomic rollback、message が `UNIQUE/constraint` を含めば `MergeConflictAlreadyApplied` 翻訳、それ以外は再 throw | 409 もしくは 500 | `ALREADY_MERGED` / `INTERNAL` | merge transaction step 6-7（手動検証） |
| 12 | DDL 0010 / 0011 / 0012 未適用 | INSERT 段で no such table | 500 | `INTERNAL` | `bash scripts/cf.sh d1 migrations list` で事前確認 |

## merge 中断時のリカバリ runbook

1. D1 `db.batch()` は全文 atomic。`identity_aliases` INSERT のみ成功 / `identity_merge_audit` INSERT 失敗 のような半端 state は構造的に発生しない。
2. `audit_log` も同一 `db.batch()` に含めるため、batch 成功 → audit_log 欠落の部分成功は構造的に発生しない。
   - 検出: `identity_aliases` / `identity_merge_audit` / `audit_log` の 3 件が同一 `merged_at` / `auditId` 系で存在することを smoke で確認
   - 補正: 欠落補正 SQL は持たない。欠落が観測された場合は batch contract 逸脱として rollback / incident 対応する。
3. 部分成功になりうる外部副作用（webhook / queue）は持たない。
4. 万一 audit row だけ残った場合は batch contract 逸脱のため、admin 手動承認のもと incident として個別復旧する。

## 検証コマンド

```bash
mise exec -- pnpm --filter @repo/api test -- identity-conflict identity-merge identity-conflict-detector
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
```

## 多角的チェック観点

- #1 schema 固定回避: Google Form schema 外の identity merge メタを 3 専用テーブルへ分離
- #3 PII 取扱: reason の email/phone redaction、API 応答は `maskResponseEmail` 経由のみ
- #5 D1 直アクセス: apps/web から D1 直参照なし、apps/api 経由のみ（route handler に閉じる）
- #11 本文 immutable: failure path に至っても `member_responses` / `response_fields` / `member_status` への UPDATE/DELETE は発行されない（実装内 grep で確認済）
- #13 admin audit logging: 成功時は `identity_merge_audit` + `audit_log` の二重記録、失敗時は両方 rollback

## 完了条件 (DoD)

- failure case 表が #1〜#12 まで網羅されている
- 各行が「実装の例外」「HTTP code」「エラー code」「対応テスト」と一対一で紐づく
- merge 中断時のリカバリ手順が runbook 化されている
- 検証コマンドが実行可能な形で明記されている

## サブタスク管理

- [x] failure case を実装の例外型と一対一で対応付け
- [x] dismiss upsert 仕様を実装と整合
- [x] D1 batch atomic rollback の挙動を明記
- [x] outputs/phase-06/main.md を更新

## 成果物

- outputs/phase-06/main.md

## タスク100%実行確認

- [x] CONST_005 必須セクション充足
- [x] 実装と完全整合
- [x] 03b 本体に手を入れていない

## 次 Phase への引き渡し

Phase 7 へ failure case 表 / リカバリ runbook / 検証コマンドを引き渡す。
