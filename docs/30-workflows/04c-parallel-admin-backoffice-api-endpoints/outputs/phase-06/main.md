# Phase 6 — 異常系検証

## failure-cases

| カテゴリ | ケース | 期待 status | 期待 body |
|---|---|---|---|
| authz | Authorization ヘッダ欠落 | 401 | `{ok:false, error:"unauthorized"}` |
| authz | 値不一致 (Bearer wrong) | 403 | `{ok:false, error:"forbidden"}`（memberId 等を含めない） |
| authz | SYNC_ADMIN_TOKEN 未設定 | 500 | `{ok:false, error:"SYNC_ADMIN_TOKEN not configured"}` |
| validate | zod 失敗（必須欠落 / 型不一致） | 400 | `{ok:false, error:"invalid_input"}` |
| state | tag queue resolved 済の再 resolve | 409 | `{ok:false, error:"invalid_transition"}` |
| state | tag queue queued から直接 resolved | 409 | `{ok:false, error:"invalid_transition"}`（reviewing 経由必須） |
| state | sync_jobs 同種 running 中の再 trigger | 409 | `{ok:false, status:"conflict"}`（既存 03a 既存挙動） |
| attendance | 同一 (memberId, sessionId) 二重 POST | 409 | `{ok:false, error:"duplicate"}` |
| attendance | 削除済み memberId への POST | 422 | `{ok:false, error:"deleted_member"}` |
| attendance | 未存在 sessionId への POST | 404 | `{ok:false, error:"not_found"}` |
| schema | 未存在 questionId への alias 指定 | 404 | `{ok:false, error:"not_found"}` |
| notes | 未存在 noteId の PATCH | 404 | `{ok:false, error:"not_found"}` |
| sync | Google secret 未設定 | 500 | `{ok:false, error:"...service account env..."}`（既存 03a 挙動） |

## audit_log 不整合検出

mutation 系で `auditLog.append` を呼ばない handler は設計上禁止。Phase 7 / 8 のコードレビュー時に grep でチェック:

```sh
grep -L "auditLog.append" apps/api/src/routes/admin/{member-,tags-,schema,meetings,attendance,member-}*.ts
```

該当が出れば手戻り。
