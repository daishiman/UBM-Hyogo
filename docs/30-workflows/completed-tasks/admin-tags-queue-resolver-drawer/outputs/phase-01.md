# Phase 1 — 要件定義 / current topology 確認

## 目的

元 spec.md の「`apps/web/app/(admin)/admin/tags/_components/` 新規追加」前提を current topology で再評価し、本タスクを `existing-tag-queue-panel-resolver-drawer-hardening` として再分類する。

## current topology 実測（2026-05-17）

`rg "TagQueuePanel" apps/web/src apps/web/app` :

| ファイル | 行 | 種別 |
| --- | --- | --- |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | 1-184 | 既存 component 本体（queue list + inline review pane + mutation） |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | 全体 | 既存 spec（resolveTagQueue を vi.mock） |
| `apps/web/app/(admin)/admin/tags/page.tsx` | 4-44 | server component が `<TagQueuePanel>` を render |

`rg "resolveTagQueue" apps/web/src` :

| ファイル | 種別 |
| --- | --- |
| `apps/web/src/lib/admin/api.ts:76` | `resolveTagQueue(queueId, body)` helper 本体（不変条件 #13 コメント付） |
| `apps/web/src/components/admin/TagQueuePanel.tsx:6,63,84` | 直接呼び出し（onConfirm / onReject） |

`rg "useAdminMutation" apps/web/src` :

| ファイル | 種別 |
| --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | hook 本体（busy guard + toast + router.refresh） |
| `apps/web/src/lib/useAdminMutation.ts` | 旧場所（features/admin/hooks 側を正本扱い） |

## 既存 API endpoint（変更しない）

endpoint 表記は層別に固定する。`apps/api` upstream 正本は `/admin/...`、`apps/web` browser fetch / BFF proxy 経路は `/api/admin/...`。

| endpoint | method | 実装 |
| --- | --- | --- |
| `/admin/tags/queue` | GET | `apps/api/src/routes/admin/tags-queue.ts`（list） |
| `/admin/tags/queue/:queueId/resolve` | POST | `apps/api/src/routes/admin/tags-queue.ts`（mutation, `tagQueueResolveBodySchema` で検証） |

| browser/BFF path | upstream path |
| --- | --- |
| `/api/admin/tags/queue` | `/admin/tags/queue` |
| `/api/admin/tags/queue/:queueId/resolve` | `/admin/tags/queue/:queueId/resolve` |

`tagQueueResolveBodySchema` (`packages/shared/src/schemas/admin/tag-queue-resolve.ts`) は discriminatedUnion("action", [confirmed, rejected]) で:

- `confirmed`: `tagCodes: string[]`（最小1件）
- `rejected`: `reason: string`（最小1文字）

## 再分類の結論

元 spec の「`_components/` 新規追加」は採用せず、**`TagQueuePanel` の hardening + drawer 抽出** に再分類する。

1. resolve 操作部のみを `TagsQueueResolveDrawer.tsx` として `apps/web/src/components/admin/` 配下に切り出し
2. `TagQueuePanel` は list + 選択 + drawer trigger に責務縮約
3. mutation を `useAdminMutation` 経由へ移行

## 確定する不変条件

- **不変条件 #13**: tag 書き込みは `tagQueueResolve` workflow 経由のみ。UI 層からの mutation は BFF `POST /api/admin/tags/queue/:queueId/resolve` のみ（upstream は `POST /admin/tags/queue/:queueId/resolve`）
- **API/D1 変更なし**: endpoint surface と `tagQueueResolveBodySchema` は変更しない
- **OKLch token**: status badge の色は `apps/web/src/styles/tokens.css` から引く（HEX 直書き禁止）
- **test 拡張子**: `*.spec.tsx` のみ
- **Preload / Electron 概念は対象外**: web app 単体

## タスク分類

- 種別: **UI task / VISUAL evidence**
- Phase 11 screenshot: 必要（drawer pattern を視覚で確認）
- 影響範囲: `apps/web` のみ

## 完了条件

- 上記 topology が `outputs/phase-11/grep-tag-queue.txt` で再現可能
- Phase 4 設計で `tagQueueResolveBodySchema` を frontend 側でも参照する経路が明示される
- 元 spec の「リスク 1〜3（tag code fetch / idempotent / dlq）」が Phase 8 に展開される
