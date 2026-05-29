# Phase 7: セキュリティ・権限設計

## 7.1 認証境界

- `/auth/session-resolve` は `internalAuth` middleware で保護されており、`X-Internal-Auth: <INTERNAL_AUTH_SECRET>` 必須。本タスクで境界変更なし
- auto-link は internal endpoint 内で完結し、外部公開なし
- backfill migration は D1 binding 経由のみで適用される（`bash scripts/cf.sh d1 migrations apply`）

## 7.2 PII 取り扱い

- log には raw email を出さず、SHA-256 8byte prefix の `email_hash` で代替
- D1 上の `response_email` は既存 schema どおり保存（本タスクで新規 PII 列追加なし）

## 7.3 権限上昇リスク

| リスク                                                                    | 対策                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 攻撃者が任意 email を投げて他人の memberId を auto-link で奪取            | session-resolve は internalAuth 必須。Auth.js Google OAuth で email verified 済の email のみが流入  |
| email verified=false の Google アカウントで攻撃                           | `auth.ts:229` で既に `if (!email || !verified) return unregistered`                                |
| Magic Link credentials provider 経由で偽 email 注入                       | `auth.ts:294-326` で payload schema 厳格 verify 済                                                 |
| 同一 email で異なる member_id を強制紐付け                                | MIN(member_id) 戦略は決定的。攻撃者が member_id を操作する経路なし                                  |

## 7.4 監査

- backfill 適用時の D1 backup は必須（NFR-03、C4）
- auto-link の log は既存 `apps/api/src/lib/logger.ts` 経由で構造化出力し、Cloudflare Logpush で長期保存される（既存基盤）
- 本タスクで新規 audit_log entry の追加は行わない（自動 link は system 由来、admin actor 不在）
