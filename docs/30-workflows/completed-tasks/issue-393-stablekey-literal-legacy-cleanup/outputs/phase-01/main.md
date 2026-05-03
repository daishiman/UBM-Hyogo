# Phase 1 — 要件定義

## 真の論点
1. 148 件 / 14 ファイルに分散する stableKey 文字列リテラルを、正本 supply module からの named import 参照に置換する。
2. 正本 module は `packages/shared/src/zod/field.ts`（`FieldByStableKeyZ` の 31 stableKey）と `packages/integrations/google/src/forms/mapper.ts`。
3. 単一の export を 1 つ追加し、全 14 ファイルから参照させることで二重定義（不変条件 #1）を静的に保護する。
4. 既存挙動（mapper / public view / admin route / consent）の同一性を維持する（runtime 値は変わらない）。
5. `--strict` モードを 0 violation にし、親 03a AC-7 の CI gate 昇格を可能 state にする。

## AC 定量化
- AC-1: strict violation 件数 0（before 148）
- AC-2: stableKeyCount = 31（保全）
- AC-3: focused vitest スイート PASS
- AC-4: typecheck PASS
- AC-5: lint + strict lint exit 0
- AC-6: 新規 suppression 0
- AC-7: 親 03a AC-7 への移行可能 state（後続 PR 化）
