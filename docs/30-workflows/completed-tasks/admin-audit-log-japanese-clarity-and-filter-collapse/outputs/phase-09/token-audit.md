# Phase 9 — OKLch トークン監査 + diff/primitive/a11y 機械検証（token-audit.md）

> AC-8（OKLch トークン・HEX ゼロ）/ AC-9（diff ゼロ・name 不変）/ AC-10（新規 primitive ゼロ）/ AC-11（a11y）の機械検証手順。

## AC-8: OKLch トークン監査（HEX / arbitrary color ゼロ）

### 専用 gate

```bash
mise exec -- pnpm verify:tokens
```

- PASS 条件: `verify-design-tokens` gate が exit 0。HEX literal / arbitrary color（`bg-[#xxx]` / `text-[#xxx]`）が 0 件。

### 追加 CSS ブロックの grep（追加分 0 件）

```bash
# globals.css の監査ログ追加ブロックに HEX / arbitrary color が無いこと
grep -nE "#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#" apps/web/src/styles/globals.css | grep -iE "chip-row|admin-audit"
# 変更 component に arbitrary color が無いこと
grep -rnE "bg-\[#|text-\[#|#[0-9a-fA-F]{3,8}\b" \
  apps/web/src/components/admin/AuditLogPanel.tsx \
  apps/web/src/components/admin/AuditLogCard.tsx \
  apps/web/src/components/admin/auditAppliedFilters.ts \
  apps/web/src/components/admin/auditGlossary.ts
```

- PASS 条件: いずれも **0 件**（マッチなし）。

### 追加 CSS が var(--ubm-*) 経由であることのチェックリスト

| 追加プロパティ | 使用トークン | 確認 |
| --- | --- | --- |
| `.admin-audit-glossary` grid-template-columns | `minmax(200px, 1fr)`（数値・色なし） | [ ] |
| `.admin-audit-card__meta` grid-template-columns | `minmax(180px, 1fr)`（数値・色なし） | [ ] |
| `.admin-audit-filter-advanced` border | `var(--ubm-color-border-default)` | [ ] |
| `.admin-audit-filter-advanced` border-radius | `var(--ubm-radius-sm)` | [ ] |
| `.admin-audit-filter-advanced` background | `var(--ubm-color-surface-panel-2)` | [ ] |
| `.admin-audit-filter-advanced` padding / margin-top | `var(--ubm-space-3)` / `var(--ubm-space-2)` | [ ] |
| `.admin-audit-filter-advanced > summary` color | `var(--ubm-color-text-secondary)` | [ ] |
| `.admin-audit-filter-advanced > summary` font-size | `var(--ubm-text-sm)` | [ ] |

> 全プロパティが `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` / `var(--ubm-text-*)` または無色の数値（minmax の px）経由であること。
> **注記**: `--ubm-color-border-subtle` は tokens.css 未定義のため新規 CSS では使わず `--ubm-color-border-default` を使用する（既存 audit CSS の subtle 使用箇所は既存挙動として不変）。

## AC-9: API/D1/shared diff ゼロ + query param キー不変

```bash
# apps/api / packages/shared の diff ゼロ
git diff --name-only -- apps/api packages/shared      # 空であること
# query param キー（input name）の英語維持（8 個）
grep -nE 'name="(action|actorEmail|targetType|targetId|from|to|batchId|limit)"' \
  apps/web/src/components/admin/AuditLogPanel.tsx
# buildAuditHref の set キー名が英語維持
grep -nE 'set\("(action|actorEmail|targetType|targetId|from|to|batchId|limit|cursor)"' \
  apps/web/src/components/admin/AuditLogPanel.tsx
```

- PASS 条件: diff 空、`name="..."` が 8 個（action/actorEmail/targetType/targetId/from/to/batchId/limit）維持、`set(...)` キー名不変。

## AC-10: 新規 primitive ゼロ

```bash
git status --porcelain apps/web/src/components/ui/    # 新規ファイル（?? / A）が無いこと
```

- PASS 条件: `apps/web/src/components/ui/` に新規ファイルが 0 件。`FormField` / `Input` / `Select` / `Chip` / `Card` / `Button` + ネイティブ `<details>` のみ再利用。

## AC-11: アクセシビリティ チェックリスト

| 項目 | 確認方法 | 確認 |
| --- | --- | --- |
| FormField label 関連付け | 既存 `FormField` が `htmlFor` / `id` を付与（label と input の関連付けが維持される）。spec で label テキスト→input 到達をアサート | [ ] |
| `<details>`/`<summary>` キーボード操作 | ネイティブ要素のため Enter / Space で開閉可能（JS 不要）。Phase 11 で手動確認 | [ ] |
| 適用フィルタ aria-label | `aria-label="現在の絞り込み条件"` が `.chip-row` に維持される（spec アサート） | [ ] |
| `<summary>` のフォーカス可視性 | ブラウザ既定 focus ring が維持される（outline を消していない） | [ ] |
| WCAG 2 AA コントラスト | `--ubm-color-text-secondary` on `--ubm-color-surface-panel-2` が AA 以上。Phase 11 で手動確認 | [ ] |

## 機械検証サマリ

| AC | 手段 | PASS 条件 |
| --- | --- | --- |
| AC-8 | `verify:tokens` + grep | gate PASS + 追加分 HEX 0 件 |
| AC-9 | `git diff` + grep | diff 空 + name 8 個 + set キー不変 |
| AC-10 | `git status` | ui/ 新規 0 件 |
| AC-11 | チェックリスト + 手動 | 全項目 OK（キーボード/コントラストは Phase 11） |
