# Phase 8 — Refactor

## 1. Refactor 方針

既存 component 境界を維持し、追加抽象は最小にする。`zoneTone` / `statusTone` は既存 `apps/web/src/lib/tones.ts` を利用する。

## 2. 実施内容

| 対象 | 内容 |
| --- | --- |
| `MemberCard` | list density branch を明示し、5 col row を構成 |
| `TagPicker` | `ReactNode` import を top-level に移動 |
| `MemberFilters` | heading を string slot として渡し、重複 `data-role` を避ける |
| CSS | `[data-component]` / `[data-role]` selector に統一 |

## 3. DoD

- [x] 新規 global helper は作らない
- [x] API adapter / shared schema は変更しない
- [x] legacy `MemberTable` は削除せず route branch のみ外す
