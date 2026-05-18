# Phase 3 — 上位設計

## 変更対象ファイル

### 新規

| path | 役割 |
| --- | --- |
| `apps/web/src/components/admin/TagsQueueResolveDrawer.tsx` | resolve drawer（dialog + form + mutation） |
| `apps/web/src/components/admin/__tests__/TagsQueueResolveDrawer.spec.tsx` | drawer の unit / interaction spec |
| `apps/web/src/components/admin/_tagQueueStatus.ts` | status → token color / label の mapping helper |

### 変更

| path | 変更概要 |
| --- | --- |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | resolve 操作部を drawer に委譲。list + 選択 + open trigger に責務縮約。`resolveTagQueue` 直接呼び出しを除去 |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | drawer モック化、mutation テストは drawer spec へ移管 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | `successMessage` を string または response mapper に拡張し、idempotent UX を caller 側で表現可能にする |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | string successMessage の後方互換と mapper successMessage の両方を検証 |
| `apps/web/app/(admin)/admin/tags/page.tsx` | 変更最小（既存 fetch + `<TagQueuePanel>` 呼出のまま） |
| `apps/web/src/styles/tokens.css` | tag-queue status badge 用 semantic token を追加（既存 token から派生） |

### 変更しないファイル

- `apps/api/src/routes/admin/tags-queue.ts`
- `apps/api/src/workflows/tagQueueResolve.ts`
- `packages/shared/src/schemas/admin/tag-queue-resolve.ts`
- `apps/web/src/lib/admin/api.ts`（`resolveTagQueue` helper は後続 task で削除候補だが本タスクは温存）
- D1 schema / migration

## 依存関係

```
page.tsx (server)
  └─ TagQueuePanel.tsx (client)
       ├─ useState(selected)
       ├─ filter button (router.push)
       ├─ list ul (existing)
       └─ TagsQueueResolveDrawer (new)
            ├─ useAdminMutation('/api/admin/tags/queue/:id/resolve','POST')
            ├─ form (confirmed / rejected toggle)
            ├─ successMessage(data) で idempotent UX 分岐
            └─ tagQueueResolveBodySchema による client 側 validation
```

## API surface 影響

なし。upstream API は既存 `POST /admin/tags/queue/:queueId/resolve` のみを利用し、browser からは BFF proxy の `/api/admin/tags/queue/:queueId/resolve` へ送る。body は `tagQueueResolveBodySchema` に準拠。

## 不変条件チェック

- #5（D1 直接アクセスなし）: 変更箇所は `apps/web` のみ
- #13（tag 書き込みは workflow 経由）: mutation 経路を `/admin/tags/queue/:id/resolve` 1 本に固定
- #8（test 拡張子）: 新規 spec は `*.spec.tsx` のみ
