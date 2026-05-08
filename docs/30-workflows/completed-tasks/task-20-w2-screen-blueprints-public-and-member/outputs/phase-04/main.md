# Phase 04 — テスト戦略

状態: `COMPLETED`
正本: `../../phase-04.md`

## 検証手段（NON_VISUAL / docs-only）

| # | 検証 | 手段 | gate 対象 |
| --- | --- | --- | --- |
| T1 | markdown 章立て | `grep -cE '^## [0-9]+\. ' 09e-...md` → 7 / 09f → 3 | AC-3 / AC-4 |
| T2 | §X.1〜X.7 揃い | 各 §X 内に `### X.1`〜`### X.7` の 7 hit | AC-5 |
| T3 | 視覚値混入 | `#[0-9a-fA-F]{3,8}\b` / `oklch\(` / `\b[0-9]+px\b` / `\bbg-\[` を fenced jsx ブロック除外して検出 → 0 | AC-9 |
| T4 | コピー原文ドリフト | login 5+1 状態語 / profile 4 領域語の grep 一致 | AC-6 / AC-7 |
| T5 | API trace check | §X.4 の method × endpoint × route 3 タプルが現行 API 正本と完全一致 | AC-10 |
| T6 | mermaid block count | `grep -c '^```mermaid' 09e-...md` ≥ 6 / 09f ≥ 2 | AC-5 |
| T7 | 9 series link | 09b / 09c / 09d / 09a へのリンクが各 §X.7 に存在 | AC-13 |
| T8 | markdown validation | lint runner（lint:md 未定義時は artifacts.json parse PASS で代替） | AC-12 |
| T9 | 不変条件参照 | `publicConsent` / `rulesConsent` / `responseEmail` の grep 出現 | AC-11 |

## 関連成果物

- `test-matrix.md`: T1〜T9 × AC-1〜13 の対応マトリクス
