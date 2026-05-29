<!-- workflow: members-list-ux-clarity / task: C / phase: 6 -->

[実装区分: 実装仕様書]

# Phase 6 — テスト追加 (Task C)

## 1. 追加 vitest (page.spec.tsx)

| ID | テスト名 | 検証 AC |
| -- | -------- | ------- |
| T-1 | propagates totalCount/displayedCount to MemberFilters live region (ok=10件) | C-AC-1, C-AC-3 |
| T-2 | renders result-count as '該当者なし' when zero items | C-AC-1 |
| T-3 | marks pagination-meta as aria-hidden | C-AC-2 |
| T-4 | renders result-count region even when fetch fails (`!ok`) with totalCount=0 | C-AC-1 |

## 2. 追加 Playwright (members-ux-clarity.spec.ts)

| ID | テスト名 | 検証 AC |
| -- | -------- | ------- |
| P-1..P-24 | `${vp} ${density} ${state}` の 24 組合せ | C-AC-4, C-AC-5 |

## 3. 既存 spec 影響

| spec | 変更 |
| ---- | ---- |
| `members-prototype-alignment.spec.ts` | (条件付) `SelectedTagsBar` → `SelectedFiltersBar` selector 追従、新 `result-count` 出現確認 1 件追加 |
| `members-filter-mobile.spec.ts` | 影響なし（本 task スコープ外） |

## 4. テスト命名規則

- すべて `*.spec.{ts,tsx}` (CLAUDE.md 不変条件 #8)
- `*.test.*` は禁止

## DoD

- [x] vitest 追加テストが AC マッピング付きで列挙
- [x] Playwright 24 test が列挙
- [x] 既存 spec 影響が記述
- [x] 命名規則明記
