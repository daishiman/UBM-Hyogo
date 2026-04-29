# Documentation Changelog — 05a

| 日付 | 変更 | 影響範囲 | 関連不変条件 |
| --- | --- | --- | --- |
| 2026-04-26 | 05a task spec 作成（13 phase ファイル + index + artifacts.json = 15 ファイル） | apps/web auth, apps/api auth, member_identities, admin_users | #5, #11 |
| 2026-04-26 | session JWT 採用方針を確定（D1 `sessions` テーブル不採用） | apps/api, infra 04 | #10 |
| 2026-04-26 | admin gate 二段防御方式を確定（middleware + requireAdmin） | 06c, 08a | #11 |
| 2026-04-26 | `INTERNAL_AUTH_SECRET` を新規 secret として追加 | infra 04 secrets リスト | #5 |
| 2026-04-26 | `GET /auth/session-resolve` を 05a / 05b で共有契約として確定 | 05b（並列タスク） | — |
| 2026-04-29 | Phase 11 で `/no-access` 不在を PASS 確認 | apps/web routes | #9 |
| 2026-04-29 | Phase 11 を PARTIAL でクローズ（実環境 smoke は 09a へ引継ぎ） | 09a staging | — |
| 2026-04-29 | implementation-guide.md（中学生 + 技術者レベル）を Phase 12 で生成 | PR 本文 | #5, #6, #9, #10, #11 |
| 2026-04-29 | Auth.js jwt.encode/decode を共有 HS256 実装へ接続し、API `verifySessionJwt` と互換化 | apps/web, packages/shared, apps/api | #5, #7, #11 |
| 2026-04-29 | 人間向け `/admin/*` API 9 router を `requireAdmin` へ差し替え、sync 系は `requireSyncAdmin` 維持 | apps/api routes/admin | #11 |
| 2026-04-29 | aiworkflow-requirements 正本（api-endpoints / task-workflow-active / quick-reference / resource-map / SKILL）を 05a current facts へ同期 | 正本仕様 | #5, #10, #11 |
| 2026-04-29 | task-specification-creator Phase 2 テンプレへ OAuth/session 共有契約 ADR と実 cookie/token 互換テストを追加 | スキル改善 | — |
| 2026-04-29 | 05a 由来の正式未タスク 3 件を `docs/30-workflows/unassigned-task/` に作成 | backlog | — |

## 不変条件への影響

- **#5 (apps/web → D1 禁止)**: `INTERNAL_AUTH_SECRET` 経由の `/auth/session-resolve` で apps/api を必ず経由する設計に固定
- **#9 (`/no-access` 不在)**: `apps/web/app/no-access` および `apps/web/src/app/no-access` が存在しないことを Phase 11 で確認済（`outputs/phase-11/no-access-check.txt`）
- **#10 (無料枠)**: D1 sessions テーブル不採用 → JWT のみ
- **#11 (admin gate)**: middleware + requireAdmin の二段防御を実装、unit test で網羅

## 削除 / 退役した方針

| 項目 | 理由 |
| --- | --- |
| D1 `sessions` テーブル | JWT 採用により不要（不変条件 #10） |
| `/no-access` ルート案 | 不変条件 #9 により採用しない。gate 失敗は `/login?gate=...` に集約 |
| middleware 単独防御 | bypass リスク（F-15, F-16）のため、API 側 requireAdmin を追加して二段化 |
