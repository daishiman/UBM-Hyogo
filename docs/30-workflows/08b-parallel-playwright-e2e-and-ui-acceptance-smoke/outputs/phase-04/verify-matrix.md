# Phase 4 verify suite × AC matrix

> 全 verify row（screen × viewport × focus / aria / layout assertion）を 1 行ずつ列挙する。`focus` 列は test の主観点、`aria/a11y` は axe 適用有無、`layout` は viewport 固有 assertion。

## 凡例

- `D` = desktop (1280x800), `M` = mobile (390x844)
- `axe` ○ = `runAxe()` で WCAG 2.1 AA 違反 0 件を assert
- `screenshot` 列は `outputs/phase-11/evidence/{viewport}/<file>` の basename
- `AC` 列は対応 Acceptance Criteria

## 公開導線（public.spec.ts）

| # | screen | viewport | focus | aria/a11y | layout assertion | screenshot | AC |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/` landing | D | hero CTA + members link | axe ○ | header / footer 表示 | `landing.png` | AC-1, AC-2 |
| 2 | `/` landing | M | mobile menu open | axe ○ | scrollWidth ≤ clientWidth | `landing.png` | AC-1, AC-2, AC-7 |
| 3 | `/members` 一覧 | D | first member card click | axe ○ | grid 列数 ≥ 2 | `members-list.png` | AC-1, AC-2 |
| 4 | `/members` 一覧 | M | first member card click | axe ○ | 1 column layout | `members-list.png` | AC-1, AC-2, AC-7 |
| 5 | `/members/[id]` 詳細 | D | profile heading visible | axe ○ | breadcrumb 表示 | `members-detail.png` | AC-1, AC-2 |
| 6 | `/members/[id]` 詳細 | M | profile heading visible | axe ○ | tag wrap layout | `members-detail.png` | AC-1, AC-2, AC-7 |
| 7 | `/register` 登録 | D | viewform link 表示 | axe ○ | external link rel=noopener | `register.png` | AC-1, AC-2 |
| 8 | `/register` 登録 | M | viewform link 表示 | axe ○ | mobile button width 100% | `register.png` | AC-1, AC-2, AC-7 |

## 認証（login.spec.ts）

| # | screen / state | viewport | focus | aria/a11y | layout assertion | screenshot | AC / 不変条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | `/login` input | D | email input + submit | axe ○ | form aria-labelledby | `login-input.png` | AC-3 |
| 10 | `/login` input | M | email input + submit | axe ○ | input width 100% | `login-input.png` | AC-3, AC-7 |
| 11 | `/login` sent | D | sent block visible | axe ○ | resend button visible | `login-sent.png` | AC-3 |
| 12 | `/login` sent | M | sent block visible | axe ○ | scrollWidth ≤ clientWidth | `login-sent.png` | AC-3, AC-7 |
| 13 | `/login` unregistered | D | unregistered block visible | axe ○ | register CTA 表示 | `login-unregistered.png` | AC-3, #9 |
| 14 | `/login` unregistered | M | unregistered block visible | axe ○ | layout overflow なし | `login-unregistered.png` | AC-3, AC-7, #9 |
| 15 | `/login` rules_declined | D | rules block visible | axe ○ | rules link 表示 | `login-rules-declined.png` | AC-3, #9 |
| 16 | `/login` rules_declined | M | rules block visible | axe ○ | layout overflow なし | `login-rules-declined.png` | AC-3, AC-7, #9 |
| 17 | `/login` deleted | D | deleted block visible | axe ○ | contact link 表示 | `login-deleted.png` | AC-3, #9 |
| 18 | `/login` deleted | M | deleted block visible | axe ○ | layout overflow なし | `login-deleted.png` | AC-3, AC-7, #9 |
| 19 | `/no-access` (route 不在) | D | response.status = 404 | — | — | （取得しない） | AC-3, #9 |

## マイページ（profile.spec.ts）

| # | screen | viewport | focus | aria/a11y | layout assertion | screenshot | AC / 不変条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | `/profile` | D | 編集 form 不在 (#4) | axe ○ | viewform link 表示 | `profile.png` | AC-1, AC-4, #4 |
| 21 | `/profile` | M | 編集 form 不在 (#4) | axe ○ | viewform button 幅 100% | `profile.png` | AC-1, AC-4, AC-7, #4 |
| 22 | `/profile` reload 後 | D | session 維持 (#8) | — | reload 後同一 user 名表示 | `profile-after-reload.png` | #8 |
| 23 | `/profile` editResponseUrl click | D | popup → forms.google.com viewform | — | popup URL 正規 | `profile-edit-response-url.png` | AC-4, #4 |

## 管理画面（admin.spec.ts）

| # | screen | viewport | focus | aria/a11y | layout assertion | screenshot | AC / 不変条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 24 | `/admin` (admin) | D | dashboard cards | axe ○ | sidebar 表示 | `admin-dashboard.png` | AC-1, AC-5 |
| 25 | `/admin` (admin) | M | dashboard cards | axe ○ | drawer 開閉 | `admin-dashboard.png` | AC-1, AC-5, AC-7 |
| 26 | `/admin/members` (admin) | D | members table | axe ○ | sort header | `admin-members.png` | AC-1, AC-5 |
| 27 | `/admin/members` (admin) | M | members table | axe ○ | horizontal scroll OK | `admin-members.png` | AC-1, AC-5, AC-7 |
| 28 | `/admin/tags` (admin) | D | tag list | axe ○ | add tag button | `admin-tags.png` | AC-1, AC-5 |
| 29 | `/admin/tags` (admin) | M | tag list | axe ○ | layout overflow なし | `admin-tags.png` | AC-1, AC-5, AC-7 |
| 30 | `/admin/schema` (admin) | D | schema viewer | axe ○ | section count = 6 | `admin-schema.png` | AC-1, AC-5 |
| 31 | `/admin/schema` (admin) | M | schema viewer | axe ○ | layout overflow なし | `admin-schema.png` | AC-1, AC-5, AC-7 |
| 32 | `/admin/meetings` (admin) | D | meetings table | axe ○ | row click | `admin-meetings.png` | AC-1, AC-5 |
| 33 | `/admin/meetings` (admin) | M | meetings table | axe ○ | layout overflow なし | `admin-meetings.png` | AC-1, AC-5, AC-7 |
| 34 | `/admin/*` × 5 (member) | D | response.status = 403 | — | — | — | AC-5, #5 |
| 35 | `/admin/*` × 5 (anonymous) | D | redirect → `/login` | — | — | — | AC-5, #5 |

## 検索（search.spec.ts）

| # | URL | viewport | focus | layout assertion | screenshot | AC |
| --- | --- | --- | --- | --- | --- | --- |
| 36 | `/members?q=tanaka` | D | URL 維持 + cards 件数 | grid 表示 | `search-q.png` | AC-6 |
| 37 | `/members?zone=hyogo&status=active` | D | 2 パラメータ AND | — | `search-zone-status.png` | AC-6 |
| 38 | `/members?tag=tag-1` | D | tag フィルタ | tag chip 表示 | `search-tag.png` | AC-6 |
| 39 | `/members?sort=name_asc` | D | sort 順序 | 1 件目 name 確認 | `search-sort.png` | AC-6 |
| 40 | `/members?q=foo&zone=osaka&status=active&tag=tag-2&sort=name_desc&density=dense` | D | 6 パラメータ複合 | empty state | `search-combo.png` | AC-6 |

## density（density.spec.ts）

| # | URL | viewport | focus | layout assertion | screenshot | AC |
| --- | --- | --- | --- | --- | --- | --- |
| 41 | `/members?density=comfy` | D | data-density=comfy | grid 列数 観測 | `density-comfy.png` | AC-6, AC-7 |
| 42 | `/members?density=dense` | D | data-density=dense | grid 列数 ↑ | `density-dense.png` | AC-6, AC-7 |
| 43 | `/members?density=list` | D | data-density=list | list レイアウト | `density-list.png` | AC-6, AC-7 |

## attendance（attendance.spec.ts、不変条件 #15）

| # | screen | viewport | focus | layout assertion | screenshot | 不変条件 |
| --- | --- | --- | --- | --- | --- | --- |
| 44 | `/admin/meetings/sess-1` dup register | D | 2 回 click → toast `既に出席登録済み` | — | `attendance-dup-toast.png` | #15 |
| 45 | `/admin/meetings/sess-1` candidate list | D | 削除済み member が候補に出ない | list aria-label | `attendance-deleted-excluded.png` | #15, #7 |

## a11y 集計（AC-8）

| spec | 適用 path | 適用 viewport | 期待 |
| --- | --- | --- | --- |
| public.spec.ts | `/`, `/members`, `/members/[id]`, `/register` | D + M | violations.length = 0 |
| login.spec.ts | `/login` (input/sent/unregistered/rules_declined/deleted) | D + M | violations.length = 0 |
| profile.spec.ts | `/profile` | D + M | violations.length = 0 |
| admin.spec.ts | `/admin`, `/admin/members` | D | violations.length = 0（color-contrast 除外） |

## 集計

| 区分 | 件数 |
| --- | --- |
| verify row 総数 | **45 行**（公開 8 + login 11 + profile 4 + admin 12 + search 5 + density 3 + attendance 2） |
| screenshot 取得行 | desktop 22 + mobile 15 = **37 枚以上の計画**（scaffolding-only 時点では AC-7 DEFERRED） |
| a11y assert 適用行 | 27 行の計画（scaffolding-only 時点では AC-8 DEFERRED） |
| 認可境界カバレッジ | 5 画面 × 3 ロール = 15 セル（AC-5 PASS） |
| 不変条件カバレッジ | #4 (#20, #23) / #5 (#34, #35) / #7 (#45) / #8 (#22) / #9 (#13〜#19) / #15 (#44, #45) |
