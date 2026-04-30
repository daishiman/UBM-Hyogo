# scenario × viewport matrix

> 表記: D = desktop (1280x800), M = mobile (390x844)。screenshot ファイル名は `outputs/phase-11/evidence/{viewport}/{filename}` 配下。

## 公開導線（4 シナリオ × 2 viewport = 8 セル）

| # | scenario | URL | spec | D | M | a11y | 期待 screenshot |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | landing | `/` | public.spec.ts | ○ | ○ | ○ | `landing.png` |
| 2 | 一覧 | `/members` | public.spec.ts | ○ | ○ | ○ | `members.png` |
| 3 | 詳細 | `/members/[id]` | public.spec.ts | ○ | ○ | ○ | `member-detail.png` |
| 4 | 登録 | `/register` | public.spec.ts | ○ | ○ | ○ | `register.png` |

→ AC-2 (8 pass) / AC-1 (4 画面 × 2 viewport)

## 認証 — AuthGateState 5 状態（5 シナリオ × 2 viewport = 10 セル）

| # | scenario | URL / state | spec | D | M | a11y | 期待 screenshot |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | login input | `/login` (input) | login.spec.ts | ○ | ○ | ○ | `login-input.png` |
| 6 | login sent | `/login` (sent) | login.spec.ts | ○ | ○ | ○ | `login-sent.png` |
| 7 | login unregistered | `/login` (unregistered) | login.spec.ts | ○ | ○ | ○ | `login-unregistered.png` |
| 8 | login rules_declined | `/login` (rules_declined) | login.spec.ts | ○ | ○ | ○ | `login-rules-declined.png` |
| 9 | login deleted | `/login` (deleted) | login.spec.ts | ○ | ○ | ○ | `login-deleted.png` |
| 9.1 | `/no-access` 不在 | `/no-access` → 404 | login.spec.ts | ○ | — | — | `login-no-access-absent.png`（assert のみ） |

→ AC-3 (5 状態 + `/no-access` 不在) / 不変条件 #9

## マイページ（profile + editResponseUrl）

| # | scenario | URL | spec | D | M | a11y | 期待 screenshot |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | profile | `/profile` | profile.spec.ts | ○ | ○ | ○ | `profile.png` |
| 11 | profile editResponseUrl | `/profile` → Google Form viewform | profile.spec.ts | ○ | ○ | — | `profile-edit-response-url.png` (clicked state) |

→ AC-4 / 不変条件 #4 (`assertNoEditFormVisible()`)

## 管理画面（5 画面 × 2 viewport = 10 セル + 認可境界 15 セル）

| # | scenario | URL | spec | D | M | a11y | 期待 screenshot |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12 | admin dashboard | `/admin` | admin.spec.ts | ○ | ○ | ○ | `admin-dashboard.png` |
| 13 | admin members | `/admin/members` | admin.spec.ts | ○ | ○ | ○ | `admin-members.png` |
| 14 | admin tags | `/admin/tags` | admin.spec.ts | ○ | ○ | ○ | `admin-tags.png` |
| 15 | admin schema | `/admin/schema` | admin.spec.ts | ○ | ○ | ○ | `admin-schema.png` |
| 16 | admin meetings | `/admin/meetings` | admin.spec.ts | ○ | ○ | ○ | `admin-meetings.png` |
| 16.1 | admin authz (member) | `/admin` as member | admin.spec.ts | ○ | — | — | `admin-forbidden-member.png` |
| 16.2 | admin authz (anon) | `/admin` as anonymous | admin.spec.ts | ○ | — | — | `admin-redirect-login.png` |

→ AC-5 (15 セル: 5 画面 × admin/member/anonymous)

## 検索（6 パラメータ × 代表 5 ケース）

| # | scenario | URL | spec | D | M | 期待 screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| 17a | q | `/members?q=山田` | search.spec.ts | ○ | ○ | `search-q.png` |
| 17b | zone | `/members?zone=神戸` | search.spec.ts | ○ | ○ | `search-zone.png` |
| 17c | status | `/members?status=active` | search.spec.ts | ○ | ○ | `search-status.png` |
| 17d | tag | `/members?tag=worship` | search.spec.ts | ○ | ○ | `search-tag.png` |
| 17e | sort + density | `/members?sort=updated&density=dense` | search.spec.ts | ○ | ○ | `search-sort-density.png` |

→ AC-6（6 パラメータ × 5 ケース）

## density 切替（3 modes）

| # | scenario | URL | spec | D | M | 期待 screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| 18a | comfy | `/members?density=comfy` | density.spec.ts | ○ | ○ | `density-comfy.png` |
| 18b | dense | `/members?density=dense` | density.spec.ts | ○ | ○ | `density-dense.png` |
| 18c | list | `/members?density=list` | density.spec.ts | ○ | ○ | `density-list.png` |

→ AC-6（density 3 値）

## attendance 二重防御（不変条件 #15）

| # | scenario | URL | spec | D | M | 期待 screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| 19a | dup register → toast | `/admin/meetings/[id]` | attendance.spec.ts | ○ | — | `attendance-dup-toast.png` |
| 19b | 削除済み member 除外 | `/admin/meetings/[id]` (selector) | attendance.spec.ts | ○ | — | `attendance-deleted-excluded.png` |

→ 不変条件 #15

---

## 集計

| 区分 | 件数 |
| --- | --- |
| screenshot 総数 (desktop + mobile) | **30 枚以上**（公開 8 + login 10 + profile 4 + admin 12 + search 10 + density 6 + attendance 2 = 52 枚目安） |
| spec ファイル | 7 |
| AC カバレッジ | AC-1〜8 全網羅 |
| a11y assertion | public / login / profile / admin の 4 spec で実行（AC-8） |

→ AC-7 (30 枚以上) を満たす設計。
