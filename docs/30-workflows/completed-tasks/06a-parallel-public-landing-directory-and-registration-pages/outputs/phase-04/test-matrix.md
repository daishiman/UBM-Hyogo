# test-matrix.md — AC × test ID

## unit (U-XX) — 06a 実装済み

| ID | 入力 | 期待 | AC |
| --- | --- | --- | --- |
| U-01 | `?q=hello&zone=0_to_1` | parsed = `{q:"hello",zone:"0_to_1",...defaults}` | AC-3, AC-6 |
| U-02 | `?zone=invalid` | `zone="all"` | AC-6 |
| U-03 | `?density=compact` | `density="comfy"` | AC-4, AC-6 |
| U-04 | `?tag=ai&tag=dx` | `tag=["ai","dx"]` | AC-5 |
| U-05 | tag 6+ 件 | 5 件 truncate | AC-5 |
| U-06 | `?q="  hello   world  "` | `q="hello world"` | AC-3 |

## contract (C-XX) — 08a 実装

| ID | route | fixture | 期待 | AC |
| --- | --- | --- | --- | --- |
| C-01 | `/` | stats + members 6 件 | Hero + StatCard + MemberCard ×6 | AC-1, AC-2 |
| C-02 | `/members?q=web` | filtered list | カード count = fixture | AC-1, AC-3 |
| C-03 | `/members/UNKNOWN` | 404 | `notFound()` | AC-1, AC-10 |
| C-04 | `/members/[id]` public | 1 member | ProfileHero + KVList (public field のみ) | AC-10 |
| C-05 | `/register` | form-preview | section count + visibility | AC-11 |

## E2E (E-XX) — 08b 実装

| ID | viewport | シナリオ | AC |
| --- | --- | --- | --- |
| E-01 | desktop | `/` Hero / Stats / CTA | AC-1, AC-12 |
| E-02 | mobile | `/` 同上 | AC-1, AC-12 |
| E-03 | desktop | `/members` filter 操作で URL 更新 + 反映 | AC-2, AC-3 |
| E-04 | mobile | `/members` 同上 | AC-3, AC-12 |
| E-05 | desktop | `/members/[id]` public 表示のみ | AC-10 |
| E-06 | mobile | 同上 | AC-10, AC-12 |
| E-07 | desktop | `/register` form-preview + responderUrl click | AC-11 |

## static (S-XX) — Phase 9 で実行

| ID | check | 期待 | AC |
| --- | --- | --- | --- |
| S-01 | `grep -r "window.UBM" apps/web` | 0 件 | AC-7 |
| S-02 | `grep -r "localStorage" apps/web` | 0 件（route/session/data 用途） | AC-9 |
| S-03 | `grep -r "questionId" apps/web/app apps/web/src` 直書き | 0 件 | AC-8 |
| S-04 | `grep -r "no-access" apps/web/app` | 0 件 | invariant #9 |

## AC × test ID 対応

| AC | unit | contract | E2E | static |
| --- | --- | --- | --- | --- |
| AC-1 | - | C-01〜C-03 | E-01〜E-07 | - |
| AC-2 | - | C-01 | E-01〜E-07 | - |
| AC-3 | U-01, U-04, U-06 | C-02 | E-03, E-04 | - |
| AC-4 | U-03 | - | - | S-03 |
| AC-5 | U-04, U-05 | - | - | - |
| AC-6 | U-02, U-03 | - | - | - |
| AC-7 | - | - | - | S-01 |
| AC-8 | - | - | - | S-03 |
| AC-9 | - | - | - | S-02 |
| AC-10 | - | C-04 | E-05, E-06 | - |
| AC-11 | - | C-05 | E-07 | - |
| AC-12 | - | - | E-01〜E-07 | - |
