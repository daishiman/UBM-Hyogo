# desktop screenshot 一覧（29 枚）

> viewport: 1280x800 / project: desktop-chromium
> 各行の `AC` / `invariant` は `outputs/phase-07/ac-matrix.md` 正本。

## 公開導線（public.spec.ts、4 枚）

| # | filename | screen | focus | AC | invariant |
| --- | --- | --- | --- | --- | --- |
| D-01 | `landing.png` | `/` | hero CTA + members link | AC-1, AC-2 | — |
| D-02 | `members-list.png` | `/members` | first member card click | AC-1, AC-2 | — |
| D-03 | `members-detail.png` | `/members/[id]` | profile heading visible | AC-1, AC-2 | — |
| D-04 | `register.png` | `/register` | viewform external link | AC-1, AC-2 | — |

## 認証 5 状態（login.spec.ts、5 枚）

| # | filename | state | AC | invariant |
| --- | --- | --- | --- | --- |
| D-05 | `login-input.png` | input | AC-3 | #9 |
| D-06 | `login-sent.png` | sent | AC-3 | #9 |
| D-07 | `login-unregistered.png` | unregistered | AC-3 | #9 |
| D-08 | `login-rules-declined.png` | rules_declined | AC-3 | #9 |
| D-09 | `login-deleted.png` | deleted | AC-3 | #7, #9 |

> `/no-access` (404) は status assert のみで screenshot 取得しない。

## profile（profile.spec.ts、3 枚）

| # | filename | focus | AC | invariant |
| --- | --- | --- | --- | --- |
| D-10 | `profile.png` | 編集 form 不在 | AC-1, AC-4 | #4 |
| D-11 | `profile-after-reload.png` | reload + localStorage.clear() 後の state 維持 | AC-4 | #8 |
| D-12 | `profile-edit-response-url.png` | popup → forms.google.com viewform | AC-4 | #4 |

## admin 5 画面（admin.spec.ts、5 枚）

| # | filename | screen | AC | invariant |
| --- | --- | --- | --- | --- |
| D-13 | `admin-dashboard.png` | `/admin` | AC-1, AC-5 | #5 |
| D-14 | `admin-members.png` | `/admin/members` | AC-1, AC-5 | #5 |
| D-15 | `admin-tags.png` | `/admin/tags` | AC-5 | #5 |
| D-16 | `admin-schema.png` | `/admin/schema` (section count = 6) | AC-5 | #5 |
| D-17 | `admin-meetings.png` | `/admin/meetings` | AC-5 | #5 |

## admin 認可境界（admin.spec.ts、2 枚）

| # | filename | role | AC | invariant |
| --- | --- | --- | --- | --- |
| D-18 | `admin-forbidden-member.png` | member → 403 | AC-5 | #5 |
| D-19 | `admin-redirect-login.png` | anon → /login redirect | AC-5 | #5 |

## 検索 5 ケース（search.spec.ts、5 枚）

| # | filename | URL | AC |
| --- | --- | --- | --- |
| D-20 | `search-q.png` | `/members?q=tanaka` | AC-6 |
| D-21 | `search-zone-status.png` | `/members?zone=hyogo&status=active` | AC-6 |
| D-22 | `search-tag.png` | `/members?tag=tag-1` | AC-6 |
| D-23 | `search-sort.png` | `/members?sort=name_asc` | AC-6 |
| D-24 | `search-combo.png` | 6 パラメータ複合 | AC-6 |

## density 3 値（density.spec.ts、3 枚）

| # | filename | URL | AC |
| --- | --- | --- | --- |
| D-25 | `density-comfy.png` | `/members?density=comfy` | AC-6, AC-7 |
| D-26 | `density-dense.png` | `/members?density=dense` | AC-6, AC-7 |
| D-27 | `density-list.png` | `/members?density=list` | AC-6, AC-7 |

## attendance（attendance.spec.ts、2 枚）

| # | filename | scenario | AC | invariant |
| --- | --- | --- | --- | --- |
| D-28 | `attendance-dup-toast.png` | 同 member 2 回 click → toast | AC-5 | #15 |
| D-29 | `attendance-deleted-excluded.png` | 削除済み member が候補に出ない | AC-5 | #15, #7 |

## 集計

- 合計: **29 枚**
- AC-1: 14 枚 / AC-2: 4 枚 / AC-3: 5 枚 / AC-4: 3 枚 / AC-5: 9 枚 / AC-6: 8 枚 / AC-7: 3 枚
- 不変条件: #4 (3) / #5 (9) / #7 (2) / #8 (1) / #9 (5) / #15 (2)
