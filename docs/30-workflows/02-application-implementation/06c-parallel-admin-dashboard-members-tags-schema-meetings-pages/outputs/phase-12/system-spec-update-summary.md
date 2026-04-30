# System Spec Update Summary

## 判定

06c は apps/web の admin UI 5画面を実装済み。正本仕様の既存 04c / 05a 契約と整合し、API 契約の新規追加はない。UI 実装内容は aiworkflow-requirements の active / quick-reference / resource-map に 06c close-out として追記対象。

## 反映済み・反映対象

| 対象 | 反映内容 | 状態 |
| --- | --- | --- |
| `references/api-endpoints.md` | 04c の `/admin/*` API 16 endpoint を 06c UI が消費する。新 endpoint なし | 既存記述で整合 |
| `indexes/quick-reference.md` | 06c admin UI 早見を追加対象 | 本レビューで更新 |
| `indexes/resource-map.md` | admin UI 実装 task と apps/web path を追加対象 | 本レビューで更新 |
| `references/task-workflow-active.md` | 06c を completed / Phase 1-12 完了 / Phase 13 pending として追加対象 | 本レビューで更新 |

## UI 正本化ポイント

- `/admin` dashboard は `GET /admin/dashboard` 1 fetch で KPI / 最近提出 / schema 状態を表示する。
- `/admin/members` は一覧 + drawer。profile 本文編集 UI は持たず、status / admin note / logical delete / editResponseUrl のみ扱う。
- `/admin/tags` は queue review / resolve 専用。member drawer からは `?memberId=` focus link のみ。
- `/admin/schema` は schema diff / alias 解消の唯一の UI。
- `/admin/meetings` は meeting session 作成と attendance 編集。削除済み会員除外、重複 disabled、409/422 toast を持つ。
- `/admin/meetings` response は既存 attendance summary を同梱し、UI 初期表示時点で重複候補を disabled にできる。

## 仕様上の境界

- `PATCH /admin/members/:memberId/profile` と `PATCH /admin/members/:memberId/tags` は作らない。
- apps/web から D1 / apps/api repository を直接 import しない。
- Phase 11 のスクリーンショットは D1 fixture / staging admin account 前提のため未取得。視覚証跡は 08b Playwright E2E または 09a staging smoke へ委譲する。
- AC-6 は現行の `scripts/lint-boundaries.mjs` / boundary test で代替検証する。ESLint 正式導入は別責務。
