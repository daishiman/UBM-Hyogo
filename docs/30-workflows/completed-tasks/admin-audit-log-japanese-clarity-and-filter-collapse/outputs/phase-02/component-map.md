# Phase 2 — component-map（責務 + props + 依存 + C1 signature）

> 上流: `./main.md` / `./layout-blueprint.md`。後続実装者の「修正ファイル一覧」入力。

## 1. Before / After 責務テーブル

| ファイル | Before（current 責務） | After（改修後 責務） | concern |
| --- | --- | --- | --- |
| `auditGlossary.ts` | `AUDIT_GLOSSARY` / `AUDIT_ACTION_PRESETS` / `AUDIT_TARGET_TYPE_PRESETS`（既存 datalist プリセット） | **3 ラベルマップ + 3 describe helper を追加**（未登録 raw fallback）。既存定数は不変 | C1 |
| `AuditLogPanel.tsx` | フィルタ 8 項目フラット（英語 label）+ ログリスト統括 | **ラベル `describeAuditField` 経由日本語化 + 2 層段階開示（`<details>`）+ datalist placeholder 日本語化**。フィルタ値・name 属性・データ取得は不変 | C1/C2 |
| `AuditLogCard.tsx` | `item.action` / `item.targetType` 生表示・`auditId` ラベル | **action を `describeAuditAction`、targetType を `describeAuditTargetType` で表示。`auditId` ラベル → 「ログID」** | C1/C3 |
| `auditAppliedFilters.ts` | 英語 label 固定でチップ生成 | **label / value を describe helper 経由で日本語化**（純関数のまま・英語キー名露出ゼロ） | C1 |
| `AuditPurposeGuide.tsx` | 用語ガイド常時表示 | **用語集グリッド整列に伴う軽微調整（必要時のみ）**。不要なら触れず diff 最小化 | C3 |
| `globals.css` | `.admin-audit-*` / `.chip-row`（wrap 未指定） | **`.chip-row` flex-wrap / `.admin-audit-glossary` / `.admin-audit-card__meta` 整列 + `.admin-audit-filter-advanced`（details）追加** | C3 |

## 2. C1: `auditGlossary.ts` の helper / map signature（確定）

```ts
// 操作コード → 日本語ラベル（生コード非表示の正本）
export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  "attendance.add": "出席を追加",
  "attendance.remove": "出席を取り消し",
  "identity.merge": "会員の名寄せ（統合）",
  "identity.dismiss": "名寄せ候補を却下",
  "admin.member.tag_assigned": "タグを割り当て",
  "admin.member.tag_unassigned": "タグを解除",
  "admin.member.status_updated": "会員ステータスを更新",
  "admin.tag.created": "タグを作成",
  "admin.request.approve": "申請を承認",
  "admin.meeting.created": "開催日を作成",
};

// 対象種別 → 日本語ラベル
export const AUDIT_TARGET_TYPE_LABELS: Readonly<Record<string, string>> = {
  meeting: "開催日",
  member: "会員",
  admin_member_note: "管理メモ",
  tag: "タグ",
};

// フィルタ/フォーム/チップのフィールド日本語ラベル（query param キー → 表示ラベル）
export const AUDIT_FIELD_LABELS: Readonly<Record<string, string>> = {
  action: "操作の種類",
  actorEmail: "実行者（メール）",
  targetType: "対象の種類",
  targetId: "対象ID",
  from: "期間（開始）",
  to: "期間（終了）",
  batchId: "一括処理ID",
  limit: "表示件数",
};

// helper: 登録あれば日本語、未登録は生コード fallback（情報欠落防止の安全弁）
export const describeAuditAction = (code: string): string =>
  AUDIT_ACTION_LABELS[code] ?? code;
export const describeAuditTargetType = (code: string | null): string =>
  code == null ? "—" : (AUDIT_TARGET_TYPE_LABELS[code] ?? code);
export const describeAuditField = (key: string): string =>
  AUDIT_FIELD_LABELS[key] ?? key;
```

### signature 設計判断

| 項目 | 決定 | 根拠 |
| --- | --- | --- |
| 戻り値型 | 全て `string`（throw しない） | [WEEKGRD-02]。未登録は raw fallback で情報欠落防止 |
| `describeAuditTargetType` の null 扱い | `null` → `"—"`（targetType は nullable） | targetType を持たない操作（システム操作等）に対応 |
| map の readonly | `Readonly<Record<string, string>>` | SSOT の不変性担保。実行時の改変を防ぐ |
| 具体値の正本 | `_shared-context.md` §4 C1 | 値の追加・修正はそこを正本に同期 |

> 未登録コードが UI に出た場合は Phase 12 未タスク化候補（SSOT 追記）として記録する（OOS）。

## 3. C2: `AuditLogPanel.tsx` フィルタ段階開示（確定）

### 常時表示（5 項目）

| key（name 属性・英語維持） | ラベル（`describeAuditField`） | primitive | datalist placeholder（日本語例示） |
| --- | --- | --- | --- |
| `action` | 操作の種類 | `FormField` + `Input`（datalist） | 例: 出席を追加 |
| `actorEmail` | 実行者（メール） | `FormField` + `Input` | 例: admin@example.com |
| `from` | 期間（開始） | `FormField` + `Input`（date） | — |
| `to` | 期間（終了） | `FormField` + `Input`（date） | — |
| `limit` | 表示件数 | `FormField` + `Select` | — |

### 詳細な絞り込み（`<details>` 内・3 項目）

| key | ラベル | primitive | placeholder |
| --- | --- | --- | --- |
| `targetType` | 対象の種類 | `FormField` + `Input`/`Select`（datalist） | 例: 開催日 |
| `targetId` | 対象ID | `FormField` + `Input` | 例: meeting_xxx |
| `batchId` | 一括処理ID | `FormField` + `Input` | 例: 一括処理の識別子 |

```tsx
<details className="admin-audit-filter-advanced" open={defaultOpen}>
  <summary>詳細な絞り込み（対象・一括処理ID）</summary>
  {/* targetType / targetId / batchId の FormField */}
</details>
```

- `defaultOpen = Boolean(filters.targetType || filters.targetId || filters.batchId)`（[VSCPKR-03]・DOM 属性）
- `<input name>` / datalist `id` は query param キー（英語）を維持（AC-1/AC-9）。

## 4. props 受け渡し（再構成後）

```
page.tsx (route owner・不変)
 └─ AuditLogPanel(searchParams 由来 filters, items)        [server fetch・既存]
     ├─ <フィルタフォーム>
     │   ├─ 常時 5 FormField (label=describeAuditField(key), name=key)
     │   └─ <details open={defaultOpen}> 詳細 3 FormField
     ├─ appliedFilters = buildAuditAppliedFilters(filters)  [純関数・describe helper 経由]
     │   └─ .chip-row（flex-wrap・日本語チップ）
     ├─ AuditPurposeGuide()                                 [用語ガイド・C3 軽微]
     └─ items.map(item =>
          AuditLogCard(item)                                [action/targetType 日本語表示]
        )
```

> `AuditLogPanel` / `AuditLogCard` の props 型・データ取得経路は変更しない。describe helper を表示時に挟むだけ（AC-9）。

## 5. 既存 primitive 対応

| ファイル | 使用する既存 primitive / 機構 |
| --- | --- |
| `auditGlossary.ts` | — （純関数 + 定数） |
| `AuditLogPanel.tsx` | `FormField` / `Input` / `Select` / `Button` / native `<details>` / `<summary>` |
| `AuditLogCard.tsx` | `Card` |
| `auditAppliedFilters.ts` | — （純関数。生成された配列を `Chip` で描画するのは呼び出し側） |
| 適用チップ描画 | `Chip`（既存） |

> 新規 primitive ゼロ（AC-10）。`<details>`/`<summary>` は HTML 標準要素であり primitive catalog の拡張ではない。

## 6. 修正ファイル一覧（Phase 5 runbook 入力）

| 区分 | パス | 内容 |
| --- | --- | --- |
| 修正 | `apps/web/src/components/admin/auditGlossary.ts` | 3 ラベルマップ + 3 describe helper 追加（C1） |
| 修正 | `apps/web/src/components/admin/AuditLogPanel.tsx` | ラベル日本語化 + 2 層段階開示 + placeholder 日本語化（C1/C2） |
| 修正 | `apps/web/src/components/admin/AuditLogCard.tsx` | action/targetType 日本語表示 + `auditId` → 「ログID」（C1/C3） |
| 修正 | `apps/web/src/components/admin/auditAppliedFilters.ts` | チップ label/value 日本語化（C1） |
| 修正（必要時） | `apps/web/src/components/admin/AuditPurposeGuide.tsx` | 用語集グリッド整列の軽微調整（C3） |
| 修正 | `apps/web/src/styles/globals.css` | `.chip-row` flex-wrap / glossary・card meta 整列 + `.admin-audit-filter-advanced`（C3） |
| 追従/新規 | `apps/web/src/components/admin/__tests__/{auditGlossary,auditAppliedFilters}.spec.ts` ほか | テスト（Phase 4 確定） |
| **変更なし** | `apps/api/**` / `packages/shared/**` / data 取得経路 / query param キー | AC-9 / AC-12 |
