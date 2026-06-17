# Phase 5 — 実装方針概要（main.md）

> `/admin/audit`（監査ログ）画面の日本語化 + フィルタ段階開示 + カード整列の実装方針を集約する。
> 不変条件: API/D1/shared 型を変更しない（AC-9）/ `<input name>` = query param キー不変 / 新規 primitive ゼロ（AC-10）/ HEX 直書きゼロ（AC-8）。

## 1. 変更対象ファイル一覧（[Feedback RT-03]）

| # | パス | 種別 | concern | 責務（After） |
| --- | --- | --- | --- | --- |
| 1 | `apps/web/src/components/admin/auditGlossary.ts` | 編集 | C1 | `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS` + `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` を追加 |
| 2 | `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | C1/C2 | フォームラベルを `describeAuditField` 経由の日本語へ。常時 5 項目 + `<details>` 詳細 3 項目の 2 層化。datalist placeholder 日本語化 |
| 3 | `apps/web/src/components/admin/AuditLogCard.tsx` | 編集 | C1/C3 | `item.action` → `describeAuditAction`、`item.targetType` → `describeAuditTargetType`、`auditId` ラベル → 「ログID」 |
| 4 | `apps/web/src/components/admin/auditAppliedFilters.ts` | 編集 | C1 | チップ label を `describeAuditField`、action/targetType の value を `describeAuditAction` / `describeAuditTargetType` 経由へ |
| 5 | `apps/web/src/components/admin/AuditPurposeGuide.tsx` | 編集（軽微・必要時のみ） | C3 | 用語集グリッド整列に伴う軽微調整（DOM 不変・CSS 側で吸収できる場合は触れない） |
| 6 | `apps/web/src/styles/globals.css` | 編集 | C3 | `.admin-audit-glossary` / `.admin-audit-card__meta` 整列 + `.admin-audit-filter-advanced`（details）追加。`.chip-row` は既存 wrap 定義を再利用 |
| 7 | `apps/web/src/components/admin/__tests__/auditGlossary.spec.ts` | 新規 | test | describe helper / ラベルマップ / raw fallback |
| 8 | `apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts` | 新規/追従 | test | チップ日本語化・英語キー名ゼロ |
| 9 | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 新規/追従 | test | 日本語ラベル・details 開閉・name 属性英語維持 |
| 10 | `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | 新規/追従 | test | action/targetType 日本語表示・未登録 raw fallback |

> 削除ファイルはなし。`__tests__/` の実ファイル名は Phase 1 で既存テスト構成を確認のうえ確定（不変条件 #8: `*.spec.{ts,tsx}` のみ）。

## 2. helper signature（C1）

```ts
export const describeAuditAction = (code: string): string;          // 登録あれば日本語 / 未登録は code（生コード fallback）
export const describeAuditTargetType = (code: string | null): string; // null → "—" / 登録あれば日本語 / 未登録は code
export const describeAuditField = (key: string): string;            // 登録あれば日本語 / 未登録は key
```

- いずれも **throw しない純粋関数**。未登録時は raw fallback（情報欠落防止の安全弁）。
- 入力は string（コード / キー）、出力は表示用 string。副作用なし。

## 3. 入出力・副作用

- すべて **server component / 純関数の表現層変更**。fetch / state / D1 / API への副作用は追加しない。
- `AuditLogPanel` は server component のまま（`<details>` はネイティブ要素で client JS 不要）。
- `<input name>` / `buildAuditHref` の `set(key, ...)` キー名 / datalist `id` を変更しない（API 契約）。

## 4. テスト方針

- `auditGlossary.spec.ts`: 3 helper の登録済 / 未登録 / null 分岐を網羅（branch 100%）。
- `auditAppliedFilters.spec.ts`: チップ label / value が日本語であること、英語キー名（`action` / `actor` / `target type` 等）が出ないこと。
- `AuditLogPanel.component.spec.tsx`: 日本語ラベル描画、`<details>` の open 既定（詳細 3 項目に値あり → open / 全空 → 閉）、`<input name>` が英語のまま。
- `AuditLogCard.spec.tsx`: action/targetType 日本語表示、未登録コードの raw fallback、`auditId` ラベル日本語化。
- jsdom は CSS を評価しないため、CSS 整列はクラス付与（構造）に限定して検証する。視覚は Phase 11 screenshot で担保。

## 5. 検証コマンド（SSOT §9 転記）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
git diff --name-only -- apps/api packages/shared      # 空であること（AC-9）
```

## 6. DoD（Definition of Done）

- AC-1〜AC-12 が phase-07 AC マトリクスで全トレース。
- typecheck / lint / verify:tokens / 対象 vitest が全 PASS。
- `apps/api` / `packages/shared` の diff ゼロ、`<input name>` 不変。
- HEX / `bg-[#` / `text-[#` ゼロ。新規 primitive ゼロ。
