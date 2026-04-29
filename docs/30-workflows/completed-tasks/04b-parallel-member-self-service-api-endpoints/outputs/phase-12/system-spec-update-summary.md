# Phase 12 — System Spec Update Summary

## 更新対象 spec

更新済み。

| spec | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | `GET /me/profile`, `POST /me/visibility-request`, `POST /me/delete-request`, `admin_member_notes.note_type` queue を反映 |
| `docs/00-getting-started-manual/specs/04-types.md` | 認証済み `/me` response 用に `AuthGateState.active` と `SessionUser.authGateState` を明文化 |
| `docs/00-getting-started-manual/specs/06-member-auth.md` | `SessionUser.authGateState: active/rules_declined/deleted` を追加 |

## 確認した整合性

- visibility/delete request の queue 化は `admin_member_notes.note_type` 列で表現（spec 07 と同期済み）
- `MeSessionResponseZ.user.authGateState` は spec 04 / 06 と同じ `active | rules_declined | deleted`
- `MemberProfileZ` (spec 04) を直接消費し、独自再定義しない
