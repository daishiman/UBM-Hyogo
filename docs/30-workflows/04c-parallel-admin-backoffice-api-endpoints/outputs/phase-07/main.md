# Phase 7 — AC マトリクス

| AC | endpoint | verify | runbook |
|---|---|---|---|
| AC-1 | 全 18 endpoint | adminGate 401/403/200 の test を各 route で 1 ケース | Phase 5 step 11 (test) |
| AC-2 | profile 編集 endpoint 不在 | `grep -R "profile" apps/api/src/routes/admin/` で hit 0 を確認 | code review |
| AC-3 | admin_member_notes が public/member view に混入しない | `MemberProfileZ`, `PublicMemberProfileZ` に notes フィールド未定義（zod 確認） | code review |
| AC-4 | 認可違反 6 ケース | adminGate test (no header / wrong / admin) × (GET/POST) | route test |
| AC-5 | publishState と isDeleted の分離 | status PATCH の zod は `{publishState?, hiddenReason?}` のみ。delete は別 endpoint | route test |
| AC-6 | tag は queue→resolve のみ | `grep -R "PATCH.*members.*tags" apps/api/src/routes/admin/` で hit 0 | code review |
| AC-7 | schema は /admin/schema 集約 | router 一覧に `/admin/schema/diff`, `/admin/schema/aliases` のみ | code review |
| AC-8 | attendance 重複 / 削除済み | attendance test で 409 / 422 を verify | route test |
| AC-9 | audit_log 全 mutation 記録 | mutation handler の test で auditLog.append 呼出を assert | route test |
| AC-10 | sync 202 + jobId / 重複 409 | 既存 03a/03b test でカバー | 既存 |
| AC-11 | response zod parse 成功 | 各 route test で `*ViewZ.parse` を通る | route test |
| AC-12 | notes は detail のみ | AdminMemberDetailViewZ にのみ含める / list view に含まない | code review |

## 完全トレース判定

→ 全 AC が test または grep（structural check）で verify 可能。**PASS**。
