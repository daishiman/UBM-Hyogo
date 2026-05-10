# Phase 2: a11y 設計

## SchemaDiffPanel

- diff row: `role="row"` + `aria-label="<type>: <question label>"` で type を音声化 (色のみ依存禁止)
- 2 カラム比較: `<section aria-label="現行">` / `<section aria-label="最新">`
- stableKey input: `<label>` 関連付け済

## IdentityConflictRow

- 2 候補比較: `<section aria-label="候補A">` / `<section aria-label="候補B">`
- merge confirm modal: 2 段階 (確認 1/2 / 2/2) + reason textarea (`<label>` 関連付け)
- error: `role="alert"` + `aria-live="polite"`

## AuditLogPanel

- 日付見出し: `<h3>` (page header `<h1>`、section `<h2>` 階層下)
- 各 entry: `<article>` + `aria-label`
- date input: `<label>` 関連付け、ISO8601 (UTC) 送信、表示は JST
- CSV export disabled: `<button disabled aria-disabled="true">` + tooltip "Coming soon"

## jest-axe

`SchemaDiffPanel.test.tsx` / `AuditLogPanel.test.tsx` で `expect(await axe(container)).toHaveNoViolations()` を導入済 (test green)。
