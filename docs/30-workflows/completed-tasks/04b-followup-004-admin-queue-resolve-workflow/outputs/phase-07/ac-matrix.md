# Phase 7 AC Matrix

| AC | Status | Test / evidence |
| --- | --- | --- |
| AC-1 admin が pending 依頼一覧を取得できる | ✅ PASS | `apps/api/src/routes/admin/requests.test.ts` TC-02 / `apps/api/src/repository/__tests__/adminNotes.test.ts` RP-1, RP-2 |
| AC-2 visibility_request 承認で `member_status.publish_state` 更新 | ✅ PASS | API TC-04（DB assertion: publish_state が hidden に変化） |
| AC-3 delete_request 承認で `member_status.is_deleted=1` | ✅ PASS | API TC-05（is_deleted=1 + deleted_members 1 行） |
| AC-4 reject 時は `member_status` 不変・note のみ rejected | ✅ PASS | API TC-06（publish_state 不変 / note rejected） |
| AC-5 二重 resolve は 409 で拒否される | ✅ PASS | API TC-08（1回目 200 / 2回目 409）+ Web TC-25 |
| AC-6 member_status + note 更新が atomic | ✅ PASS | D1 batch + サブクエリガード設計 + TC-04/05/06 で状態整合 |
| AC-7 PII raw 値を admin UI に出さない | ✅ PASS | Web TC-PII（DOM に email 出ない）+ API `sanitizePayload` |

全 AC PASS。
