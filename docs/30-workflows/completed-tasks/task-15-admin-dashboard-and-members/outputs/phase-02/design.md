# Phase 2: 設計 (outputs)

> 仕様書: `../../phase-02.md` を正本。本ファイルは topology / state ownership / API client 契約 / a11y を要約。

## コンポーネント topology

### `/admin`
```
(admin)/admin/page.tsx [Server, dynamic=force-dynamic]
└── AdminPageHeader
└── SchemaAlertCard?  (totals.unresolvedSchema > 0)
└── KpiGrid
    └── KpiCard × 4 (total / public / untagged / schema)
└── grid-2
    ├── ZoneDistribution
    └── RecentActionsTable
└── StatusDistribution
```

### `/admin/members`
```
(admin)/admin/members/page.tsx [Server]
└── AdminPageHeader (CSV export disabled)
└── MembersClientShell ["use client"]
    ├── MembersFilters (q / zone / filter / sort)
    ├── BulkActionBar (selected.length > 0 で出現)
    ├── MembersTable (items / pagination / row select / row click)
    └── MemberDrawer? (openMemberId !== null のみマウント)
```

### `(admin)/layout.tsx`
```
AdminLayout (RSC, async)
├── await getSession() → 401 redirect("/login?next=/admin"), forbidden→/login?gate=forbidden
└── grid-cols-[240px_1fr]
    ├── <aside> AdminSidebar
    └── <main> {children}
```

## State ownership 引き渡しテーブル

| state | 所有者 | 初期値 | 更新トリガ |
|------|--------|--------|----------|
| `selected: Set<string>` | MembersClientShell | `new Set()` | row checkbox / BulkActionBar onComplete |
| `openMemberId: string\|null` | MembersClientShell | `null` | row 氏名 click / Drawer onClose |
| URLSearchParams (q/zone/filter/sort/page) | URL | server SSR | MembersFilters.onChange → router.replace |
| `pending` | useTransition | false | filter 変更 |
| `data: AdminMemberDetailView\|null` | MemberDrawer (local) | null | useEffect([memberId]) cancelled flag |

## API client 設計（既存 `apps/web/src/lib/admin/*` を維持）

```ts
// Server Component read
fetchAdmin<AdminDashboardView>("/admin/dashboard");
fetchAdmin<AdminMemberListView>("/admin/members?...");
fetchAdmin<AdminMemberDetailView>("/admin/members/<id>");

// Client mutation (既存 src/lib/admin/api.ts に既存)
patchMemberStatus(memberId, { publishState })
deleteMember(memberId, reason)
restoreMember(memberId)
```

`@ubm-hyogo/shared` schema は変更しない。`byZone` / `byStatus` は `apps/web/src/lib/admin/admin-dashboard-ui.ts` の web local mapper に閉じる。

## a11y 契約
- `<table>` に `<caption class="sr-only">` + `<th scope="col">`
- row click は `<button>` wrap
- MemberDrawer: `role="dialog"` + ESC 閉じ
- BulkActionBar: `role="region"` + `aria-label="一括操作"` + `aria-live="polite"`
- ZoneDistribution: `role="img" aria-label`
- icon-only button: `aria-label`

## z-index
`z-banner < z-bulkbar (z-30) < z-drawer (z-40) < z-modal (z-50)`

## Wave / fan-out gate
- W1: lib/admin client surface
- W2: _dashboard 6 コンポーネント
- W3: _members 5 コンポーネント
- W4: page.tsx 2 ファイル
- **W5: `(admin)/layout.tsx` 確定 → task-16/17 fan-out gate**
- W6: テスト / a11y / smoke

## 完了
- [x] topology 確定
- [x] state 引き渡しテーブル確定
- [x] API client シグネチャ衝突回避（既存 src/lib/admin/* 維持）
- [x] a11y / role 契約確定
