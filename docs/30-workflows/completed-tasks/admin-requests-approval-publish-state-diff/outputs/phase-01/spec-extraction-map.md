# Phase 1 成果物: spec-extraction-map（system spec ↔ current code anchor 1:1）

> 状態: completed。system spec の各要素と current code の責務 owner を 1:1 で対応づける。

## 1. 責務 owner マップ

| 責務 | owner（current code anchor） | 役割 |
| --- | --- | --- |
| route | `apps/web/src/app/(admin)/admin/requests/page.tsx` | `/admin/requests` ルートエントリ |
| 一覧 + 詳細 + ダイアログ統括 | `apps/web/src/components/admin/RequestQueuePanel.tsx`（240 行） | `RequestQueueItem` 配列の保持・選択 state・`destructiveMessage` 生成・確認ダイアログ呼び出し |
| 申請詳細表示 | `apps/web/src/components/admin/RequestQueueDetail.tsx`（96 行） | dl で会員/種別/申請内容を列挙。**diff 行の新 owner** |
| 確認ダイアログ | `apps/web/src/components/admin/RequestConfirmDialog.tsx`（125 行） | HTML5 `<dialog>` 二段階確認。`destructiveMessage` 表示（92-94 行） |
| データ契約（projection） | `apps/api/src/routes/admin/requests.ts`（`projectListItem` 162-183 / `AdminRequestListItemZ` 55-60） | `memberSummary.{publishState,isDeleted}` + `requestedPayload` 供給（**変更しない**） |

## 2. system spec ↔ current code anchor 1:1 表

| system spec | spec anchor | current code anchor | 本タスクでの扱い |
| --- | --- | --- | --- |
| design tokens（OKLch 正本） | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | `apps/web/src/styles/tokens.css`（`--ubm-color-accent-ink` / `--ubm-color-text-secondary` / `--ubm-color-text-muted` / `--ubm-color-warn`） | diff 強調色を既存トークンで賄う（新規追加原則なし） |
| primitives catalog | `docs/00-getting-started-manual/specs/09c-primitives.md` | `apps/web/src/components/ui/`（card / badge 等） | 新規 primitive 追加なし。`data-diff-side` 属性 + globals.css で構成 |
| admin 画面 contract | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | `/admin/requests`（RequestQueuePanel/Detail/ConfirmDialog） | diff 行を contract 内に追加（route / testid / API パス不変） |
| admin requests endpoint | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `GET /admin/requests` / `POST /admin/requests/:noteId/resolve` | 参照のみ・変更なし |
| apps/web → apps/api 境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | admin gate proxy（D1 直接禁止） | 境界不変・3 値限定 |

## 3. publishState 値域（実コード裏取り・要件入力）

| 値 | source | 日本語ラベル（本タスク導入） |
| --- | --- | --- |
| `public` | `requests.ts:191` `PUBLISH_STATES` | 公開 |
| `member_only` | `requests.ts:191` `PUBLISH_STATES` | 会員限定 |
| `hidden` | `requests.ts:191` `PUBLISH_STATES` | 非公開 |
| `unknown`（fallback） | `projectListItem` fallback | 不明 |

> publishState → 日本語ラベルの変換は Request 系コンポーネントに未存在。本タスクで `formatPublishStateLabel` を新設する。

## 4. fixture anchor（VISUAL 検証 / テスト入力）

| fixture | anchor | note_type / payload |
| --- | --- | --- |
| TEST-NOTE-V01 | `apps/api/src/testing/test-accounts/catalog.ts:134-137` | `visibility_request` / `{ desiredState: "hidden" }`（public→hidden） |
| TEST-NOTE-V02 | `catalog.ts:141-144` | `visibility_request` / `{ desiredState: "public" }`（hidden→public） |
| TEST-NOTE-D01 | `catalog.ts:148-150` | `delete_request`（payload なし） |
