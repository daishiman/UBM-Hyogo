# admin-ui-prototype-alignment: 実装ガイド

Status: `implemented_local_runtime_pending` (Lane A-E コード変更完了 / authenticated Phase 11 視覚検証は user-gated)

## Part 1: 中学生レベルの説明

管理画面は、いくつかの棚が並ぶ図書館のようなものです。今までは、1つの棚で本を取れないだけで、図書館全体が真っ暗になっていました。今回の変更で、壊れた棚だけに「今は使えません」という札を立て、他の棚は普通に使えるようにしました。

対象は管理者向けの 11 画面です。一般公開ページや会員プロフィール画面は変更していません。新しい API や DB は作らず、すでにあるデータ取得の失敗を画面の小さな単位で受け止めるようにしました。

## Part 2: 技術者向けの説明

### 概要

staging `/admin` で頻発していた全画面エラーバウンダリ (`管理画面を表示できませんでした`) を廃止し、fetch 失敗を **per-section `AdminSectionError` degrade** に切り替えた。あわせて admin 画面群で再利用される共通コンポーネントを `apps/web/src/features/admin/components/_shared/` に集約した。

### 新規ファイル (Lane A)

```
apps/web/src/lib/result.ts                                   SafeResult<T>
apps/web/src/lib/admin/safe-server-fetch.ts                  safeServerFetch helper
apps/web/src/features/admin/components/_shared/
  ├── AdminSectionCard.tsx
  ├── AdminSectionError.tsx
  ├── AdminEmptyState.tsx
  ├── AdminStat.tsx
  ├── AdminTable.tsx
  ├── AdminQueuePanel.tsx
  ├── index.ts (barrel)
  └── __tests__/*.spec.tsx (29 spec)
apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts   (4 spec)
apps/web/src/styles/globals.css                               (+281 lines, admin-* component CSS)
```

### 修正 (Lane B-E)

10 admin pages を `fetchAdmin` → `safeServerFetch + AdminSectionError` 化:

| route | 主な変更 |
|-------|---------|
| `/admin` | safeServerFetch + DashboardSections 分離 + AdminSectionError fallback |
| `/admin/dashboard/attendance` | overview / by-session / ranking の 3 fetch を per-section degrade |
| `/admin/members` | safeServerFetch + AdminSectionError、header description は失敗時 "読み込みに失敗" |
| `/admin/tags` | safeServerFetch + AdminSectionError、TagQueuePanel props 不変 |
| `/admin/meetings` | meetings/members 並列を safeServerFetch 化、いずれか fail で AdminSectionError |
| `/admin/meetings/[id]` | safeServerFetch + early-return AdminSectionError |
| `/admin/schema` | safeServerFetch + SchemaDiffPanel 失敗時 fallback、sections fallback 維持 |
| `/admin/requests` | safeServerFetch + AdminSectionError、RequestQueuePanel view は inline 構築 |
| `/admin/identity-conflicts` | safeServerFetch + AdminSectionError、nextCursor 分岐は ok ブランチ内 |
| `/admin/audit` | 手書き try/catch を safeServerFetch ベースに移行（既存 AuditLogPanel props 維持） |

### API contract

```ts
// apps/web/src/lib/result.ts
export type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; correlationId?: string } };

// apps/web/src/lib/admin/safe-server-fetch.ts
export async function safeServerFetch<T>(
  path: string,
  opts?: AdminFetchOptions,
): Promise<SafeResult<T>>;
```

HTTP status は `code: ADMIN_FETCH_<status>` (例: `ADMIN_FETCH_500`)、それ以外の Error は `ADMIN_FETCH_FAILED`、非 Error は `ADMIN_FETCH_UNKNOWN`。

`AdminSectionError` は `role="alert"` / `aria-live="polite"` で sectionLabel / code / correlationId / message を表示。retry CTA は v1 では出さず "再読込してください" テキストに統一。

### 品質ゲート

| gate | 結果 |
|------|------|
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |
| `pnpm --filter @ubm-hyogo/web test -- --run` | 127 files / 897 passed / 1 skipped |
| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | 9/9 PASS (HEX 直書き 0 件) |

### User-gated boundary

| 項目 | 理由 |
|------|------|
| Phase 11 視覚検証 (4 viewport × 5 screen = 20 screenshot) | authenticated admin runtime が必要なため user-gated。`outputs/phase-11/` の pending inventory で追跡し、実施時は同 workflow に evidence を追加 |
| 既存 `*Panel.tsx` の内部実装を `AdminTable` / `AdminQueuePanel` で書き直し | API surface 不変で持ち越し可。別 task |
| `TagsClientShell` / `RequestsClientShell` 新設 | 同上 |
| `KpiCard` → `AdminStat` 統合 | Phase 8 で persistent な判断保留事項として明示 |
| staging deploy / production deploy | user 承認後の operations |

### ロールバック

各 page.tsx の差分は `git diff dev -- apps/web/app/(admin)/admin/` で確認可能。`safeServerFetch` を `fetchAdmin` に戻し `AdminSectionError` 分岐を削除すれば原状復帰可能（`_shared/` 配下は新規追加のみで既存 import に影響なし）。
