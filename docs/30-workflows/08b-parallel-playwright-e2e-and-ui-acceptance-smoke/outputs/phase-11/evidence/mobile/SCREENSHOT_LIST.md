# mobile screenshot 一覧（15 枚）

> viewport: 390x844 / project: mobile-webkit
> 各行の `AC` / `invariant` は `outputs/phase-07/ac-matrix.md` 正本。
> mobile 共通 layout 観点: `scrollWidth ≤ clientWidth`（横スクロール禁止）/ button 幅 100%。

## 公開導線（public.spec.ts、4 枚）

| # | filename | screen | focus | AC | invariant |
| --- | --- | --- | --- | --- | --- |
| M-01 | `landing.png` | `/` | mobile menu open / 1 column | AC-2, AC-7 | — |
| M-02 | `members-list.png` | `/members` | 1 column layout | AC-2, AC-7 | — |
| M-03 | `members-detail.png` | `/members/[id]` | tag wrap layout | AC-2, AC-7 | — |
| M-04 | `register.png` | `/register` | mobile button width 100% | AC-2, AC-7 | — |

## 認証 5 状態（login.spec.ts、5 枚）

| # | filename | state | AC | invariant |
| --- | --- | --- | --- | --- |
| M-05 | `login-input.png` | input（input 幅 100%） | AC-3, AC-7 | #9 |
| M-06 | `login-sent.png` | sent | AC-3, AC-7 | #9 |
| M-07 | `login-unregistered.png` | unregistered | AC-3, AC-7 | #9 |
| M-08 | `login-rules-declined.png` | rules_declined | AC-3, AC-7 | #9 |
| M-09 | `login-deleted.png` | deleted | AC-3, AC-7 | #7, #9 |

## profile（profile.spec.ts、1 枚）

| # | filename | focus | AC | invariant |
| --- | --- | --- | --- | --- |
| M-10 | `profile.png` | 編集 form 不在 / viewform button 幅 100% | AC-4, AC-7 | #4 |

## admin 5 画面（admin.spec.ts、5 枚）

| # | filename | screen | focus | AC | invariant |
| --- | --- | --- | --- | --- | --- |
| M-11 | `admin-dashboard.png` | `/admin` | drawer 開閉 | AC-5, AC-7 | #5 |
| M-12 | `admin-members.png` | `/admin/members` | horizontal scroll OK（テーブル例外） | AC-5, AC-7 | #5 |
| M-13 | `admin-tags.png` | `/admin/tags` | layout overflow なし | AC-5, AC-7 | #5 |
| M-14 | `admin-schema.png` | `/admin/schema` | layout overflow なし | AC-5, AC-7 | #5 |
| M-15 | `admin-meetings.png` | `/admin/meetings` | layout overflow なし | AC-5, AC-7 | #5 |

## 集計

- 合計: **15 枚**
- AC-2: 4 枚 / AC-3: 5 枚 / AC-4: 1 枚 / AC-5: 5 枚 / AC-7: 全 15 枚
- 不変条件: #4 (1) / #5 (5) / #7 (1) / #9 (5)

## desktop との合算

- desktop 29 + mobile 15 = **44 枚** → AC-7「30 枚以上」充足。
