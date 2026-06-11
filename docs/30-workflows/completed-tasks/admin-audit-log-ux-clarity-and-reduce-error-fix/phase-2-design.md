# Phase 2 — 設計

> 正本: [shared-context.md](./shared-context.md)。本書は topology / lane / validation を設計する。

## 1. アーキテクチャ方針

- すべて `apps/web` 表現層に閉じる。server component（page.tsx）が `safeServerFetch` で取得し、client/presentational component が表示する既存責務境界を維持。
- 新規 primitive は作らない。既存 `Card` / `Chip` / `Banner` / `EmptyState` / `FormField` / `Button` / `Pagination` / `BatchIdCopyButton` を再利用（不変条件3・[FB-SDK-07-1] 既存コンポーネント再利用優先）。
- 純データ・純関数（glossary / appliedFilters / errorMessage）は副作用なし・例外を投げない（[WEEKGRD-02] 防御的返却）。

## 2. 状態所有権（混在禁止）

| レイヤ | 所有する状態 | 備考 |
|--------|-------------|------|
| `audit/page.tsx`（Server） | fetch 結果 `data` / `error` / `values` | API I/O はここだけ |
| `AuditLogPanel`（presentational） | なし（props 表示のみ） | フォームは uncontrolled（既存踏襲） |
| `AuditPurposeGuide`（presentational） | なし | 静的表示 |
| `AuditLogCard`（presentational） | `<details>` open は DOM ネイティブ | React state を持たない |
| `TagCatalogPanel`（client） | `items` 等の useState（既存） | 防御ガードは初期値で吸収 |

## 3. コンポーネント topology

```
audit/page.tsx (Server)
 ├─ AdminPageHeader (既存)
 └─ AuditLogPanel (props: data, values, error)
     ├─ AuditPurposeGuide            ← Lane B 新規（常時表示・最上部）
     ├─ <form> フィルタ (既存 FormField×8 + datalist 拡充)   ← Lane B
     ├─ Banner(error → auditErrorMessage())  ← Lane B（エラー親切化）
     ├─ AppliedFilters chips (auditAppliedFilters())  ← Lane A
     ├─ EmptyState (既存)
     ├─ <ol.admin-audit-timeline>
     │   └─ AuditLogCard × items     ← Lane A 新規
     └─ Pagination (既存)
```

## 4. 関数・型シグネチャ設計

### Lane A
```ts
// auditAppliedFilters.ts
export interface AppliedFilterChip { readonly key: string; readonly label: string; }
export function toAppliedFilterChips(
  filters: AdminAuditFilters | undefined,
  fallbackLimit: string,
): AppliedFilterChip[];
// 未指定（全フィールド空）のとき [] を返し、UI 側で「なし（直近 N 件）」を表示
```
```tsx
// AuditLogCard.tsx
export function AuditLogCard({ item }: { readonly item: AdminAuditListItem }): JSX.Element;
// 内部で既存 maskAuditText / extractBatchId / maskAuditJson / summarizeAuditJson / formatJst を再利用
```

### Lane B
```ts
// auditGlossary.ts
export interface AuditGlossaryEntry { readonly term: string; readonly plain: string; readonly technical: string; }
export const AUDIT_GLOSSARY: readonly AuditGlossaryEntry[];      // action/actor/target/batchId/PII
export const AUDIT_ACTION_PRESETS: readonly string[];            // datalist 用（attendance.add, identity.merge, identity.dismiss …）
export const AUDIT_TARGET_TYPE_PRESETS: readonly string[];       // meeting, admin_member_note …
```
```ts
// auditErrorMessage.ts
export interface AuditErrorView { readonly title: string; readonly hint?: string; }
export function toAuditErrorView(error: string): AuditErrorView;
// 404 → 疎通/deploy/認可ヒント, "from" range → 期間の前後ヒント, cursor → リセット誘導, それ以外 → generic
```
```tsx
// AuditPurposeGuide.tsx
export function AuditPurposeGuide(): JSX.Element;   // props なし・静的。AUDIT_GLOSSARY を描画
```

### Lane C
```tsx
// TagCatalogPanel.tsx（編集）
const safeItems = initial?.items ?? [];
const safeTotal = initial?.total ?? 0;
const [items, setItems] = useState<TagDefinitionItem[]>(safeItems);
// counts useMemo は items（空配列で安全）。pager は safeTotal を使う
```

## 5. ライブラリ選定

新規外部ライブラリ採用なし（renderer node-only import 禁止 [W1-02b-4] に該当する追加なし）。`Intl.DateTimeFormat` は既存利用。

## 6. SubAgent lane（仕様書作成の並列分割）

> 実装レーン（A/B/C）とは別。仕様書を書く SubAgent の分担。各 SubAgent は別 phase ファイルを書くため競合しない。

| SubAgent | 担当成果物 |
|----------|-----------|
| SubAgent-1 | `phase-4-test-plan.md`, `phase-5-implementation.md` |
| SubAgent-2 | `phase-6-test-additions.md`, `phase-7-coverage.md`, `phase-8-refactor.md`, `phase-9-qa.md` |
| SubAgent-3 | `phase-10-final-review.md`, `phase-11-manual-test.md`, `phase-13-pr.md`, `outputs/phase-11/*`, `phase-12-documentation.md`, `outputs/phase-12/*`（strict 7） |

検証 lane（artifacts.json / index.md / gate）はオーケストレータ（親）が直列で締める。

## 7. テスト戦略（[VSCPKR-03] props vs internal state）

- `AuditLogCard` / `AuditPurposeGuide` は **external props のみ**（internal state なし）。RED は props 注入で書く。
- `TagCatalogPanel` reduce-guard は `initial` prop の undefined パターンを注入。`window.api` モックは `Object.defineProperty`（[VSCPKR-02] `vi.stubGlobal("window")` 禁止）。
- 純関数（auditAppliedFilters / auditErrorMessage）は input→output の表駆動テスト。

## 8. エッジケース

| ケース | 期待挙動 |
|--------|---------|
| `appliedFilters` undefined | チップ列「なし（直近 N 件）」 |
| from のみ / to のみ 指定 | 期間チップを「2026-06-01 以降」「2026-06-09 まで」と表現 |
| actorEmail = null（system 操作） | カードに「実行者: システム」 |
| targetType/targetId = null | 「対象: —」 |
| before/after 両方 null | 折りたたみ summary「変更内容: なし」 |
| API error が 404 含む | title + 疎通/deploy/認可ヒント |
| `initial.items` undefined（catalog） | 空配列・EmptyState・クラッシュなし |

## 9. アクセシビリティ

- タイムラインは `<ol aria-label="監査ログ一覧">`。カードは `<li>`。
- guide は `<section aria-label="この画面の説明">`。
- action バッジ Chip は色のみに依存せずテキストを持つ。
