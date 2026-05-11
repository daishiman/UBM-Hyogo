# Phase 2: 設計

[実装区分: 実装仕様書]

## 目的

既存 3 画面 + canonical admin helper 層の topology・component 階層・state ownership・props/internal-state 区分を確定する。新設ではなく、現行実装との差分を補強する。

## 既存コンポーネント再利用 (FB-SDK-07-1)

| primitive | 配置 | 再利用方針 |
|-----------|------|----------|
| `Button` | `apps/web/src/components/ui/button.tsx` | variant=primary/ghost のみ使用 |
| `Modal` | `apps/web/src/components/ui/modal.tsx` | confirm modal は全 3 画面で同一 primitive |
| `Badge` | `apps/web/src/components/ui/badge.tsx` | tone=success/warning/danger/info/neutral |
| `Input` | `apps/web/src/components/ui/input.tsx` | type=email/text/date |
| `Select` | `apps/web/src/components/ui/select.tsx` | targetType フィルタで使用 |
| `AdminPageHeader` | task-15 layout/header 実装 | 既存があれば再利用。不在なら各 page の現行 header を維持 |
| `AdminSidebar` | task-09/10 確定済み | aria-current 判定は task-15 layout 任せ |

> 新規 primitive は作らない。新たな variation が必要な場合は Phase 3 でユーザーへエスカレーション。

## Component 階層

### `/admin/schema`

```
AdminSchemaPage (server, existing `apps/web/app/(admin)/admin/schema/page.tsx`)
└─ SchemaDiffPanel (client/server boundary: existing component)
   ├─ section "current" (read-only summary)
   ├─ section "latest" (read-only summary)
   └─ diff rows + stableKey assign controls
      └─ stableKey input + assign Button (unresolved/added 行のみ)
```

### `/admin/identity-conflicts`

```
AdminIdentityConflictsPage (server, existing `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`)
└─ IdentityConflictRow[] (existing component)
   └─ merge / dismiss actions through `apps/web/src/lib/admin/api.ts`
```

### `/admin/audit`

```
AdminAuditPage (server, existing `apps/web/app/(admin)/admin/audit/page.tsx`)
└─ AuditLogPanel (existing component)
   ├─ filter form
   ├─ timeline / table view
   └─ cursor pagination
```

## State ownership table

| state | owner | 引き渡し |
|-------|-------|---------|
| conflict action state | `IdentityConflictRow` | row 単位で reason / pending を管理 |
| `stableKey` 入力値 | `SchemaDiffPanel` 内の row state | row 単位で独立 |
| `pending` action (merge/dismiss) | `IdentityConflictRow` 内部 state | confirm 表示制御 |
| filter form values | URL searchParams が source of truth | `AuditLogPanel` は defaultValue + submit で URL 更新 |
| `cursor` | URL searchParams | `AuditLogPanel` が next URL を構築 |

> **[VSCPKR-03] 適用**: 各 component で「テスト操作対象は internal state か external prop か」を明示。`AuditLogPanel` の入力は **defaultValue (uncontrolled)**、`IdentityConflictRow` の reason / pending は **internal state**、API response item は **prop**。

## Wave (W) 分割

| Wave | 内容 | gate |
|------|------|------|
| W1 | task-15 W5 通過確認 + endpoint 存在検証 (`grep app.get/post`) | 不在 endpoint 0 件 |
| W2 | `apps/web/src/lib/admin/api.ts` / `server-fetch.ts` の不足 helper と contract test | focused unit test green |
| W3 | `SchemaDiffPanel` + `/admin/schema/page.tsx` の不足補強 | schema diff SSR 200 |
| W4 | `IdentityConflictRow` + `/admin/identity-conflicts/page.tsx` の不足補強 | conflict resolve 動作 |
| W5 | `AuditLogPanel` + `/admin/audit/page.tsx` の不足補強 | filter URL 反映 + cursor pagination |
| W6 | jest-axe + vitest + 手動 smoke | task-18 引き渡し |

## OKLch token mapping

| 用途 | token / className |
|------|------------------|
| schema diff `added` 行背景 | `bg-success-soft` (`color-mix(in oklch, var(--ubm-color-success) 8%, transparent)`) |
| schema diff `removed` 行背景 | `bg-danger-soft` |
| schema diff `changed` 行背景 | `bg-warning-soft` |
| audit action `.delete/.reject` chip | tone=`danger` |
| audit action `.create/.confirm` chip | tone=`success` |
| audit action `.update/.resolve` chip | tone=`warning` |
| audit action `.view` chip | tone=`neutral` |
| その他 | tone=`info` |

## a11y 設計

- schema diff row: `role="row"` + `aria-label="追加: <question label>"` 等で type を音声化 (色だけに依存しない)
- compare 2 card: `<section aria-label="候補A">` / `<section aria-label="候補B">`
- merge confirm modal: keep 選択は `<radiogroup>` (将来拡張用、本 task は merge_left/right/dismiss の 3 button)
- audit timeline 日付見出し: `<h3>` (page header `<h1>`、section `<h2>` を下回らない)
- audit entry: `<article>` + `aria-label`
- date input: `min`/`max` 双方向 client validate, ISO8601 (UTC) 送信、表示は JST
- CSV export disabled: `<button disabled aria-disabled="true">` + Tooltip "Coming soon"

## エラーパターン設計 (UI 反映)

| code/condition | UI |
|----------------|-----|
| schema apply 409 | Banner "他管理者が同時実行中です" + 再フェッチ提案 |
| stableKey 重複 (422) | input 直下に form エラー文 |
| identity merge 422 | list 再フェッチ + 該当行 fade-out |
| audit 重複 cursor | `useTransition` pending guard |
| `/admin/schema/aliases` 404 | assign Button `disabled` + tooltip "API 未提供" |

## 並列タスク競合対策

| ファイル | 衝突回避策 |
|---------|----------|
| `apps/web/src/lib/admin/api.ts` | 既存 export へ additive 追記のみ。task-16 の meeting/tag/request helper を削除しない |
| `apps/web/src/components/admin/*` | 既存 component patch のみ。新規 `_schema/_audit/_conflicts` tree は作らない |
| `apps/web/app/(admin)/layout.tsx` | **編集禁止** (task-15 R) |

## 成果物

- `outputs/phase-02/component-tree.md` — 上記 component 階層 + state ownership table
- `outputs/phase-02/wave-plan.md` — W1-W6 + 各 gate
- `outputs/phase-02/oklch-mapping.md` — token mapping
- `outputs/phase-02/a11y-checklist.md` — a11y 設計

## DoD

- [ ] 既存 primitive 再利用方針が確定
- [ ] state ownership / props vs internal state が全 component で明記
- [ ] OKLch token mapping が HEX 0 件で構成可能
- [ ] 並列タスク (task-15/16) との衝突回避策が確定
