# Phase 8: DRY 化 — main

## 1. 目的

Phase 6 で配置した 5 repository / 共有層 / fixture / boundary tooling のなかから DRY 化できる重複を特定し、可読性と保守性を改善した。詳細は `before-after.md`。

## 2. 抽出した重複

| 領域 | 重複内容 | 対処 |
| --- | --- | --- |
| repository SELECT 列名 | `adminNotes` / `auditLog` / `syncJobs` で `SELECT a AS b, c AS d ...` の 6〜9 列を 3 ヶ所で記述 | 各 repo で `SELECT_COLS` 定数化 |
| Raw → Domain 変換 | `parseJson` / `toRow` / `toEntry` の boilerplate | 各 repo に `toRow` / `parseJson<T>` helper を切り出し |
| Branded type 適用 | `r.email as AdminEmail` の cast を呼び出し側で書く | `toRow` 内に集約 |
| in-memory loader migration parse | 行コメント / 行内コメントの除去 | `stripComments` / `splitStatements` helper を `_setup.ts` に隔離 |

## 3. 採用しなかった DRY

| 候補 | 不採用理由 |
| --- | --- |
| 5 repo 共通の `selectAll<T>(c, sql)` ジェネリック wrapper | 過抽象化。ロジックが prepared statement / bind 組み立てに散らばり、単純 SQL のままが可読性が高い |
| `auditLog` / `syncJobs` 共通の JSON カラム serializer | 用途（after_json / metrics_json / error_json）でセマンティクスが異なる。`parseJson<T>` まで個別に持たせる |
| 5 repo で `crypto.randomUUID()` を helper 化 | 1 行で十分、helper を増やすと dependency が広がる |

## 4. 完了条件チェック

- [x] 同じ SELECT 列リストを 1 ヶ所にまとめた
- [x] Raw → Domain 変換を `toRow` 関数に統一
- [x] migration parse を `_setup.ts` に隔離
- [x] 過抽象化を避けた（採用しなかった候補を明記）
