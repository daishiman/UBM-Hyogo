# Phase 12 — ドキュメント更新 主成果物

## 実装サマリー (PR メッセージ案)

### feat(api): /me/* member self-service endpoints (04b)

`apps/api` (Hono) に会員本人向け 4 endpoint を追加した。

- `GET /me` — SessionUser + authGateState (active/rules_declined/deleted)
- `GET /me/profile` — MemberProfile + statusSummary + editResponseUrl + fallbackResponderUrl
- `POST /me/visibility-request` — admin_member_notes に visibility_request を queue
- `POST /me/delete-request` — admin_member_notes に delete_request を queue

#### 不変条件

- #4: PATCH 系 method を一切 mount しない（response_fields に書き込まない）
- #11: path に :memberId を含めず session.user.memberId のみ参照
- #12: GET 系 response 型に admin_member_notes 由来のキーが現れない (strict zod)

#### スキーマ変更

- migration `0006_admin_member_notes_type.sql`: `admin_member_notes.note_type` 列追加 (DEFAULT 'general')
- 既存行は 'general' として扱う後方互換あり

#### テスト

- `apps/api/src/routes/me/index.test.ts` (14 件) を含む 231 件 pass
- `apps/api/src/repository/__tests__/adminNotes.test.ts` で `note_type` default / request type / pending 判定を直接検証
- typecheck pass

#### 残課題 (下流タスク)

- 05a/b: Auth.js cookie ベースの SessionResolver に置換（暫定 dev token は `x-ubm-dev-session: 1` 必須、かつ production / staging では無効）
- 06b: `/me/profile` を SSR/CSR で消費
- 07a/07c: admin queue resolve 時の processed / resolved metadata を設計する

## spec drift 確認

| spec | 影響 | 対応 |
| --- | --- | --- |
| 07-edit-delete.md | visibility/delete API 仕様 | `/me/profile` と visibility/delete request、`admin_member_notes.note_type` を反映済み |
| 06-member-auth.md | SessionUser 型 | `authGateState: active/rules_declined/deleted` を同期済み |
| 04-types.md | MemberProfile / AuthGateState | `active` と認証済み session 状態を同期済み。`MemberProfileZ.strict()` は直接消費 |

drift は spec 更新と runtime zod parse で解消済み。

## CHANGELOG (任意)

`CHANGELOG.md` は本リポジトリで未管理のため追記なし。
