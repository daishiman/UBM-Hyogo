# Phase 3 — 設計レビュー

## 判定サマリー

| 案 | 概要 | 判定 | 採否 |
| --- | --- | --- | --- |
| A | Phase 2 案: `/me/*` 単一 router、admin_member_notes.note_type で queue | PASS | 採用 |
| B | PATCH /me/profile を許可 | MAJOR (#4 違反) | 却下 |
| C | `member_self_requests` テーブル新設 | MINOR | 保留 |
| D | path に `:memberId` を含めて admin と共用 | MAJOR (#11 違反) | 却下 |

## 採用案 A の不変条件確認

- #4: PATCH 系 method 不在 (`createMeRoute` に POST/GET のみ)
- #5: D1 アクセスは apps/api 内 repository に閉じる
- #7: `MeSessionUserZ.memberId` と `responseId` を別フィールド
- #11: path に `:memberId` を含めない、`session.user.memberId` のみ参照
- #12: `MeProfileResponseZ.strict()` + `MemberProfileZ.strict()` で `notes`/`adminNotes` 禁止

## 引き継ぎ事項 (Phase 4)

- A の 4 endpoint × middleware を verify suite (unit / contract / authz / integration) に展開
- 二重申請判定は `adminNotes.hasPendingRequest` を MVP の単一 source とする
