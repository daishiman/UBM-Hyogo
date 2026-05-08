# Phase 08: DRY 化（重複排除 / generator 化方針）

state: COMPLETED

## DRY 適用箇所

| 箇所 | DRY 戦略 | 結果 |
| --- | --- | --- |
| zone tokens (a..e) | status tokens の alias で一本化 | 値の二重管理を排除（§3.3） |
| theme 値 | `:root[data-theme="..."]` selector で並列定義 | 共通 token は ベース層、theme 差分のみ overlay |
| sRGB fallback | `@supports not (...)` block で hex 提示 | OKLch ↔ hex の対応表は §3.5 で 1 箇所集約 |
| JSON / CSS / Tailwind | JSON を SSOT とし、§9 → §10 に generator 化方針記述 | 将来 Style Dictionary で自動生成可能 |

## generator 化方針（将来）

- 入力: `09b-design-tokens.md` 内 inline JSON
- 出力: `tokens.css` / `globals.css` (`@theme inline` block) / `tailwind.config.ts`
- 採用候補: Style Dictionary or 自前 build script
- MVP では手動同期で運用、CI gate (task-18) で drift 検出
