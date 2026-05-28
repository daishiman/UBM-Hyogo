# step-04-tags-assignment 実装仕様書

**[実装区分: 実装仕様書 (queue resolver drawer)]**
**[直列順序: 4/5 | 前提: step-01 useAdminMutation hook]**

## 1. 目的

admin/tags 画面に tag assignment queue の resolver drawer を追加し、confirmed/rejected resolve mutation を useAdminMutation で実装する。

## 2. スコープ

- **変更対象**: `apps/web/app/(admin)/admin/tags/` 配下
- **新規実装**: TagsQueueList + TagsQueueResolveDrawer component
- **API**:
  - `GET /api/admin/tags/queue` (list, 実装済)
  - `POST /api/admin/tags/queue/:queueId/resolve` (mutation, 実装済)
- **UI パターン**: queue list → resolve drawer → confirmed/rejected mutation

## 3. 変更対象ファイル一覧

```
apps/web/app/(admin)/admin/tags/
  ├── page.tsx (server component, fetch + render)
  └── _components/ (新規 dir)
      ├── TagsQueueList.tsx (新規)
      ├── TagsQueueResolveDrawer.tsx (新規)
      └── index.ts

apps/web/src/lib/admin/
  ├── server-fetch.ts (GET /api/admin/tags/queue 利用)
```

## 4. 設計

### 4.1 TagsQueueList component

**役割**: tag assignment queue 一覧表示

**Props**:
```typescript
interface TagsQueueListProps {
  readonly items: readonly TagQueueItem[];
}

interface TagQueueItem {
  readonly queueId: string;
  readonly memberId: string;
  readonly responseId: string;
  readonly status: "queued" | "reviewing" | "resolved" | "rejected" | "dlq";
  readonly suggestedTags: readonly string[];
  readonly createdAt: string;
}
```

**UI 構成**:
- table または card list で queue item 表示
  - queueId
  - memberId
  - status badge (色分け)
  - suggestedTags (chip list)
  - "Resolve" button → drawer open

## 4.2 TagsQueueResolveDrawer component

**役割**: queue item の confirmed/rejected resolve

**Props**:
```typescript
interface TagsQueueResolveDrawerProps {
  readonly queueId: string;
  readonly memberId: string;
  readonly suggestedTags: readonly string[];
  readonly open: boolean;
  readonly onClose: () => void;
}
```

**UI フロー**:
1. queue item の "Resolve" button → drawer open
2. drawer 表示
   - queueId, memberId info (read-only)
   - suggestedTags display
   - radio or segment: "Confirmed" / "Rejected"
   - if "Confirmed" → tag selection (checkboxes or multi-select)
   - if "Rejected" → reason textarea
   - "Submit" button
3. submit → mutation
4. success → drawer close + list refetch

**API Contract**:
```
POST /api/admin/tags/queue/:queueId/resolve

(confirmed)
{
  "action": "confirmed",
  "tagCodes": ["code-a", "code-b"]
}

(rejected)
{
  "action": "rejected",
  "reason": "no suitable tags"
}

Response (200):
{
  "ok": true,
  "result": {
    "status": "resolved",
    "tagCodes": ["code-a"],
    "idempotent": false,
    "memberId": "m1",
    "resolvedAt": "2026-05-15T10:00:00Z"
  }
}
```

## 5. 関数・型シグネチャ

### TagsQueueList
```typescript
export function TagsQueueList({
  items,
}: TagsQueueListProps): ReactNode;
```

### TagsQueueResolveDrawer
```typescript
export function TagsQueueResolveDrawer({
  queueId,
  memberId,
  suggestedTags,
  open,
  onClose,
}: TagsQueueResolveDrawerProps): ReactNode;
```

## 6. 入出力・副作用

### TagsQueueList
- **入力**: items array (API fetch 済)
- **出力**: table/card list HTML
- **副作用**: button click → drawer open (state管理は parent page)

### TagsQueueResolveDrawer
- **入力**: queueId, memberId, suggestedTags, open, onClose
- **出力**: drawer + form
- **副作用**: useAdminMutation trigger, router.refresh(), drawer close

## 7. テスト方針

### TagsQueueList.spec.tsx
- [✓] items render as rows
- [✓] status badge color
- [✓] suggestedTags display
- [✓] resolve button click → onResolve or parent state

### TagsQueueResolveDrawer.spec.tsx
- [✓] open={true} → drawer render
- [✓] "Confirmed" selected → tagCodes input
- [✓] "Rejected" selected → reason textarea
- [✓] submit → mutation trigger (confirmed path)
- [✓] submit → mutation trigger (rejected path)
- [✓] 200 response → drawer close + onClose callback
- [✓] form validation (confirmed: 最小1 tag, rejected: 最小1文字 reason)

## 8. ローカル実行コマンド

```bash
# unit test
pnpm test apps/web --run -- TagsQueueList.spec.tsx
pnpm test apps/web --run -- TagsQueueResolveDrawer.spec.tsx

# dev server
pnpm dev
# → http://localhost:3000/admin/tags
# → queue list 表示
# → "Resolve" button → drawer
# → confirmed/rejected select + submit

# e2e
pnpm e2e:smoke
```

## 9. DoD

### 実装完了
- [✓] TagsQueueList 実装
- [✓] TagsQueueResolveDrawer 実装
- [✓] unit test green
- [✓] page.tsx で fetch + component 統合

### 品質
- [✓] drawer a11y (role, aria-label)
- [✓] form validation (tagCodes/reason)
- [✓] design token 色 使用
- [✓] status badge color mapping

### 動作確認
- [✓] queue list render
- [✓] drawer open/close
- [✓] confirmed/rejected toggle
- [✓] mutation 後 list 自動 refetch
- [✓] smoke test PASS

## 10. リスク

1. **tag code fetch**: suggestedTags (code list) が api response に含まれるか確認
2. **idempotent handling**: idempotent: true の場合の UX （duplicate resolve warning?）
3. **dlq items**: dlq status items の扱い（resolve button disable？）

## 11. 前提

**step-01 完了**: useAdminMutation hook 確立済

## 12. 変更統計

- 新規: 2 components + 2 spec files + 1 page refactor
- API endpoint: 2 (list, resolve)

---

**Updated**: 2026-05-15
**Status**: Superseded for implementation planning

## 13. superseded trace（2026-05-17）

Current topology では `apps/web/src/components/admin/TagQueuePanel.tsx` が既に queue list と inline review pane を持つため、本 spec の `_components/TagsQueueList.tsx` 新規追加前提は採用しない。後続実装は `docs/30-workflows/completed-tasks/admin-tags-queue-resolver-drawer/` を canonical workflow root とし、`TagQueuePanel` hardening + `TagsQueueResolveDrawer` 抽出 + `useAdminMutation` 経由化として進める。
