# Phase 7 AC トレースマトリクス

> AC-1〜8 × scenario × viewport × screenshot × invariant の完全トレース。漏れなく 1:1 対応する。

## 凡例

- `D` = desktop (1280x800), `M` = mobile (390x844)
- `screenshot` 列は `outputs/phase-11/evidence/{viewport}/<file>` の basename
- `invariant` は `docs/00-getting-started-manual/specs/00-overview.md` の不変条件番号
- `failure` は Phase 6 failure cases（F-1〜F-14）

---

## AC-1: 検証マトリクス全 20 セル green

| 行 | scenario | viewport | spec | screenshot | invariant | failure |
| --- | --- | --- | --- | --- | --- | --- |
| 1-1 | landing | D | public | `landing.png` | — | F-1, F-9 |
| 1-2 | landing | M | public | `landing.png` | — | F-9 |
| 1-3 | members 一覧 | D | public | `members-list.png` | — | F-1 |
| 1-4 | members 一覧 | M | public | `members-list.png` | — | F-9 |
| 1-5 | members 詳細 | D | public | `members-detail.png` | — | F-1 |
| 1-6 | members 詳細 | M | public | `members-detail.png` | — | F-9 |
| 1-7 | register | D | public | `register.png` | — | — |
| 1-8 | register | M | public | `register.png` | — | F-9 |
| 1-9 | login (代表 input) | D | login | `login-input.png` | #9 | F-2 |
| 1-10 | login (代表 input) | M | login | `login-input.png` | #9 | F-9 |
| 1-11 | profile | D | profile | `profile.png` | #4, #8 | F-7 |
| 1-12 | profile | M | profile | `profile.png` | #4 | F-9 |
| 1-13 | admin dashboard | D | admin | `admin-dashboard.png` | #5 | F-10, F-11 |
| 1-14 | admin dashboard | M | admin | `admin-dashboard.png` | #5 | F-9 |
| 1-15 | admin members | D | admin | `admin-members.png` | #5 | F-10 |
| 1-16 | admin members | M | admin | `admin-members.png` | #5 | F-9 |
| 1-17 | density comfy | D | density | `density-comfy.png` | — | — |
| 1-18 | density dense | D | density | `density-dense.png` | — | — |
| 1-19 | density list | D | density | `density-list.png` | — | — |
| 1-20 | search 代表 | D | search | `search-q.png` | — | — |

→ **20 セル green** で AC-1 PASS。

---

## AC-2: 公開導線 4 シナリオ × 2 viewport

| 行 | scenario | viewport | spec | screenshot | invariant | failure |
| --- | --- | --- | --- | --- | --- | --- |
| 2-1 | landing | D | public.spec.ts | `landing.png` | — | F-1 |
| 2-2 | landing | M | public.spec.ts | `landing.png` | — | F-9 |
| 2-3 | 一覧 `/members` | D | public.spec.ts | `members-list.png` | — | F-1 |
| 2-4 | 一覧 `/members` | M | public.spec.ts | `members-list.png` | — | F-9 |
| 2-5 | 詳細 `/members/[id]` | D | public.spec.ts | `members-detail.png` | — | F-1 |
| 2-6 | 詳細 `/members/[id]` | M | public.spec.ts | `members-detail.png` | — | F-9 |
| 2-7 | 登録 `/register` | D | public.spec.ts | `register.png` | — | — |
| 2-8 | 登録 `/register` | M | public.spec.ts | `register.png` | — | F-9 |

→ 8 セル PASS。

---

## AC-3: AuthGateState 5 状態 + `/no-access` 404

| 行 | scenario | viewport | spec | screenshot | invariant | failure |
| --- | --- | --- | --- | --- | --- | --- |
| 3-1 | login input | D | login.spec.ts | `login-input.png` | #9 | F-2 |
| 3-2 | login input | M | login.spec.ts | `login-input.png` | #9 | F-9 |
| 3-3 | login sent | D | login.spec.ts | `login-sent.png` | #9 | — |
| 3-4 | login sent | M | login.spec.ts | `login-sent.png` | #9 | F-9 |
| 3-5 | login unregistered | D | login.spec.ts | `login-unregistered.png` | **#9** | F-3 |
| 3-6 | login unregistered | M | login.spec.ts | `login-unregistered.png` | **#9** | F-3, F-9 |
| 3-7 | login rules_declined | D | login.spec.ts | `login-rules-declined.png` | **#9** | F-4 |
| 3-8 | login rules_declined | M | login.spec.ts | `login-rules-declined.png` | **#9** | F-4, F-9 |
| 3-9 | login deleted | D | login.spec.ts | `login-deleted.png` | **#7, #9** | F-5 |
| 3-10 | login deleted | M | login.spec.ts | `login-deleted.png` | **#7, #9** | F-5, F-9 |
| 3-11 | `/no-access` 不在（404） | D | login.spec.ts | （screenshot 取得しない / status assert のみ） | **#9** | F-6 |

→ 5 状態 × 2 viewport + `/no-access` 不在 = 11 行。**不変条件 #9** を 11 行すべてでトレース。

---

## AC-4: editResponseUrl 遷移

| 行 | scenario | viewport | spec | screenshot | invariant | failure |
| --- | --- | --- | --- | --- | --- | --- |
| 4-1 | profile 表示（編集 form 不在） | D | profile.spec.ts | `profile.png` | **#4** | F-7 |
| 4-2 | profile 表示（編集 form 不在） | M | profile.spec.ts | `profile.png` | **#4** | F-7, F-9 |
| 4-3 | editResponseUrl click → forms.google.com viewform | D | profile.spec.ts | `profile-edit-response-url.png` | **#4** | F-8 |
| 4-4 | editResponseUrl click → forms.google.com viewform | M | profile.spec.ts | `profile-edit-response-url.png` | **#4** | F-8 |
| 4-5 | reload + localStorage.clear() でも state 維持 | D | profile.spec.ts | `profile-after-reload.png` | **#8** | F-14 |

→ 5 行。**不変条件 #4 と #8** を顕在化。

---

## AC-5: admin 5 × 認可境界 3

### 5.1 admin ロールでの 5 画面表示（D + M）

| 行 | scenario | viewport | spec | screenshot | invariant | failure |
| --- | --- | --- | --- | --- | --- | --- |
| 5-1 | `/admin` | D | admin.spec.ts | `admin-dashboard.png` | #5 | — |
| 5-2 | `/admin` | M | admin.spec.ts | `admin-dashboard.png` | #5 | F-9 |
| 5-3 | `/admin/members` | D | admin.spec.ts | `admin-members.png` | #5 | — |
| 5-4 | `/admin/members` | M | admin.spec.ts | `admin-members.png` | #5 | F-9 |
| 5-5 | `/admin/tags` | D | admin.spec.ts | `admin-tags.png` | #5 | — |
| 5-6 | `/admin/tags` | M | admin.spec.ts | `admin-tags.png` | #5 | F-9 |
| 5-7 | `/admin/schema` | D | admin.spec.ts | `admin-schema.png` | #5 | — |
| 5-8 | `/admin/schema` | M | admin.spec.ts | `admin-schema.png` | #5 | F-9 |
| 5-9 | `/admin/meetings` | D | admin.spec.ts | `admin-meetings.png` | #5 | — |
| 5-10 | `/admin/meetings` | M | admin.spec.ts | `admin-meetings.png` | #5 | F-9 |

### 5.2 認可境界（5 画面 × 3 ロール = 15 セル）

| 行 | scenario | role | spec | screenshot | invariant | failure |
| --- | --- | --- | --- | --- | --- | --- |
| 5-11 | `/admin` 5 画面 × admin | admin | admin.spec.ts | （5.1 と同じ） | #5 | — |
| 5-12 | `/admin` 5 画面 × member → 403 | member | admin.spec.ts | `admin-forbidden-member.png` | **#5** | F-10 |
| 5-13 | `/admin` 5 画面 × anonymous → `/login` | anon | admin.spec.ts | `admin-redirect-login.png` | **#5** | F-11 |

### 5.3 attendance（admin 配下、不変条件 #15）

| 行 | scenario | viewport | spec | screenshot | invariant | failure |
| --- | --- | --- | --- | --- | --- | --- |
| 5-14 | attendance dup register → toast | D | attendance.spec.ts | `attendance-dup-toast.png` | **#15** | F-12 |
| 5-15 | attendance 候補から削除済み除外 | D | attendance.spec.ts | `attendance-deleted-excluded.png` | **#15, #7** | F-12 |

→ 15 セル + attendance 2 行。**不変条件 #5, #15** を顕在化。

---

## AC-6: 検索 6 パラメータ + density 3 値

| 行 | scenario | viewport | spec | screenshot | invariant | failure |
| --- | --- | --- | --- | --- | --- | --- |
| 6-1 | `?q=tanaka` | D | search.spec.ts | `search-q.png` | — | — |
| 6-2 | `?zone=hyogo&status=active` | D | search.spec.ts | `search-zone-status.png` | — | — |
| 6-3 | `?tag=tag-1` | D | search.spec.ts | `search-tag.png` | — | — |
| 6-4 | `?sort=name_asc` | D | search.spec.ts | `search-sort.png` | — | — |
| 6-5 | `?q=foo&zone=osaka&status=active&tag=tag-2&sort=name_desc&density=dense`（6 パラメータ複合） | D | search.spec.ts | `search-combo.png` | — | — |
| 6-6 | `?density=comfy` | D | density.spec.ts | `density-comfy.png` | — | — |
| 6-7 | `?density=dense` | D | density.spec.ts | `density-dense.png` | — | — |
| 6-8 | `?density=list` | D | density.spec.ts | `density-list.png` | — | — |

→ 検索 5 ケース（6 パラメータ網羅）+ density 3 値 = 8 行。

---

## AC-7: screenshot ≥ 30 枚

| 区分 | desktop | mobile | 合計 |
| --- | --- | --- | --- |
| 公開導線 | 4 | 4 | 8 |
| login 5 状態 | 5 | 5 | 10 |
| profile (base/after-reload/edit-response-url) | 3 | 1 | 4 |
| admin 5 画面 | 5 | 5 | 10 |
| admin 認可境界 (member 403 + anon redirect) | 2 | — | 2 |
| search 5 ケース | 5 | — | 5 |
| density 3 値 | 3 | — | 3 |
| attendance 2 シナリオ | 2 | — | 2 |
| **合計** | **29** | **15** | **44** |

→ 30 枚以上 PASS。

---

## AC-8: axe WCAG 2.1 AA 0 件

| 行 | path | viewport | spec | invariant | failure |
| --- | --- | --- | --- | --- | --- |
| 8-1 | `/` | D | public.spec.ts | — | F-13 |
| 8-2 | `/` | M | public.spec.ts | — | F-13 |
| 8-3 | `/members` | D | public.spec.ts | — | F-13 |
| 8-4 | `/members` | M | public.spec.ts | — | F-13 |
| 8-5 | `/members/[id]` | D | public.spec.ts | — | F-13 |
| 8-6 | `/members/[id]` | M | public.spec.ts | — | F-13 |
| 8-7 | `/register` | D | public.spec.ts | — | F-13 |
| 8-8 | `/register` | M | public.spec.ts | — | F-13 |
| 8-9 | `/login` (5 state) | D | login.spec.ts | #9 | F-13 |
| 8-10 | `/login` (5 state) | M | login.spec.ts | #9 | F-13 |
| 8-11 | `/profile` | D | profile.spec.ts | #4 | F-13 |
| 8-12 | `/profile` | M | profile.spec.ts | #4 | F-13 |
| 8-13 | `/admin` | D | admin.spec.ts | #5 | F-13 |
| 8-14 | `/admin/members` | D | admin.spec.ts | #5 | F-13 |

→ 14 行で `violations.length === 0` を assert。

---

## 不変条件最終トレース（必須 4 件）

| 不変条件 | AC 行 | 主たる test |
| --- | --- | --- |
| **#4 profile 編集 form 不在** | AC-4 (4-1〜4-4), AC-1 (1-11, 1-12), AC-8 (8-11, 8-12) | profile.spec.ts: `getByRole('form', { name: /編集/ }).toHaveCount(0)` + popup → forms.google.com viewform |
| **#8 reload 後 state 維持** | AC-4 (4-5), AC-1 (1-11) | profile.spec.ts: reload + `localStorage.clear()` でも `ようこそ` 表示 |
| **#9 `/no-access` 不在 + AuthGateState 出し分け** | AC-3 (3-5〜3-11), AC-8 (8-9, 8-10) | login.spec.ts: 5 state visible + `/no-access` status === 404 |
| **#15 attendance 二重防御** | AC-5 (5-14, 5-15) | attendance.spec.ts: dup toast + 削除済み非表示 |

→ 必須 4 件すべてが複数 AC 行で多重トレースされており、漏れなし。

## scenario × viewport 全カバー確認

| カテゴリ | 要件 | カバー行 |
| --- | --- | --- |
| 公開導線 4 シナリオ | landing/list/detail/register | AC-2 (2-1〜2-8) |
| login 5 状態 | input/sent/unregistered/rules_declined/deleted | AC-3 (3-1〜3-10) |
| profile | profile + editResponseUrl + reload | AC-4 (4-1〜4-5) |
| admin 5 画面 | dashboard/members/tags/schema/meetings | AC-5 (5-1〜5-10) |
| 検索 6 パラメータ | q / zone / status / tag / sort / density（複合行 6-5 で 6 パラメータ全合流） | AC-6 (6-1〜6-5) |
| density 3 値 | comfy / dense / list | AC-6 (6-6〜6-8) |

→ 全カテゴリ漏れなし。
