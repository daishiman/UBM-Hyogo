# System Spec Update Summary

## Step 1: 更新要否判定

| 正本 | 判定 | 理由 / 反映内容 |
|------|------|-----------------|
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | **更新済み** | `GET /admin/requests` / `POST /admin/requests/:noteId/resolve`、member_status preflight、same-batch audit append を追記 |
| `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | **更新済み** | admin queue UI → admin proxy → `/admin/requests*` の flow と `resolveAdminRequest` を追記 |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | **更新済み** | 編集/削除依頼の admin 側処理経路に admin queue resolve を追記 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | **更新済み** | admin queue 運用（FIFO / 二段確認 / 二重 resolve 409）を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | **更新済み** | workflow inventory に 04b-followup-004 を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | **更新済み** | `/admin/requests` の即時導線を登録 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | **更新済み** | 04b-followup-004 を implementation_completed として同期 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned.md` | **更新済み** | D1 batch preflight / visual delegated gate / stub consumed 化 lessons を追記 |
| `packages/shared/src/schemas/admin/admin-request-resolve.ts` | **追加済み** | resolve body shared schema/type を SSOT 化 |

## Step 2: 反映内容（要点）

### api-endpoints.md
- `GET /admin/requests` 行を Admin セクションに追加（query / response / pagination）
- `POST /admin/requests/:noteId/resolve` 行を追加（body / 409 仕様）

### architecture-admin-api-client.md
- admin queue画面 (`/admin/requests`) の server fetch + client mutation flow
- admin proxy `/api/admin/*` 経由のみ（不変条件 #5）

### 07-edit-delete.md
- 会員 self-service の visibility/delete request が admin queue に流れ、admin が承認/却下する旨を追記

### 11-admin-management.md
- admin queue resolve workflow セクション追加: FIFO 順、confirmation modal、二段確認、二重 resolve 409、audit ログ

### lessons-learned.md
- D1 batch + subquery-gated UPDATE による atomicity 確保パターン
- 楽観ロック（`WHERE request_status='pending'` + `meta.changes`）による二重 resolve 防止
- audit targetType enum の制約（`admin_member_note` 未対応 → `member` 丸め + `after_json.noteId`）

### resource-map.md / quick-reference.md / task-workflow-active.md
- workflow inventory + 即時導線の登録、active workflow を completed 同期

## ノート
- 上記反映は同一 wave で実施済み。実 screenshot は staging visual evidence 未タスクに分離した。
