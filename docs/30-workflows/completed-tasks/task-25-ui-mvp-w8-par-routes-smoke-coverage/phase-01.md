# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 1 / 要件定義 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 1 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 1 の判断結果を `outputs/phase-01/requirements.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-01/requirements.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 1 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-01/requirements.md` に集約する。

## 詳細

## P50 前提確認チェック

| 確認項目 | 結果 |
|---------|------|
| current branch に実装が存在する | **Yes**（task-18 で `full-smoke.spec.ts` および `visual/*.spec.ts` 実装済み） |
| upstream（main/dev）にマージ済み | **Yes**（commit `822cc5eb` で task-18 が dev にマージ済み） |
| 前提タスク（依存タスク）が完了済み | **Yes**（task-11〜18, task-20/21 完了済み） |

**判定**: `implementation_mode = "verify_existing"`
**Phase 5 戦略**: 新規 spec 実装は行わず、既存 spec / route 群を起点に matrix 文書を作成する diff check 中心。

## タスク分類（Phase 11 / Phase 12 で参照）

| 分類軸 | 値 |
|--------|------|
| タスク種別 | **docs-only** |
| 視覚証跡要件 | **NON_VISUAL**（UI 変更を伴わない / 既存 spec を起点に文書化のみ） |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 1. ゴール

MVP recovery 対象の **17 URL smoke entries + 2 component surfaces** × **5 軸**（status code / 主要 DOM element / token utility 適用 / a11y / interaction）について、Playwright smoke / visual の最小 assertion を route 別に明文化した coverage matrix を作成し、CI gate（task-18）が「何を守っているか」を可視化する。

## 2. 非ゴール

- 新規 Playwright spec / route 実装の追加（task 外）
- 既存 spec のリファクタリング・スナップショット更新
- visual baseline の追加（4 screens 以外は phase outline で「未採取 + 将来候補」と明記）
- D1 / API 契約レベルのテスト追加
- token 値 SSOT の変更（task-08 / task-09 が正本）

## 3. 対象 17 URL smoke entries + 2 component surfaces（inventory）

| # | 層 | route（Playwright path） | source group | auth |
|---|----|--------------------------|--------------|------|
| 1 | 公開 | `/` | `(public)` | unauth |
| 2 | 公開 | `/members` | `(public)/members` | unauth |
| 3 | 公開 | `/members/[id]`（fixture `sample-001`） | `(public)/members/[id]` | unauth |
| 4 | 公開 | `/register` | `(public)/register` | unauth |
| 5 | 公開 | `/privacy` | `privacy` | unauth |
| 6 | 公開 | `/terms` | `terms` | unauth |
| 7 | 会員 | `/login` | `login` | unauth |
| 8 | 会員 | `/profile` | `profile` | member required |
| 9 | 管理 | `/admin` | `(admin)/admin` | admin required |
| 10 | 管理 | `/admin/members` | `(admin)/admin/members` | admin required |
| 11 | 管理 | `/admin/tags` | `(admin)/admin/tags` | admin required |
| 12 | 管理 | `/admin/meetings` | `(admin)/admin/meetings` | admin required |
| 13 | 管理 | `/admin/schema` | `(admin)/admin/schema` | admin required |
| 14 | 管理 | `/admin/requests` | `(admin)/admin/requests` | admin required |
| 15 | 管理 | `/admin/identity-conflicts` | `(admin)/admin/identity-conflicts` | admin required |
| 16 | 管理 | `/admin/audit` | `(admin)/admin/audit` | admin required |
| 17 | 共通 | `error.tsx`（500 系トリガ） | `app/error.tsx` | unauth |
| 18 | 共通 | `not-found.tsx`（`/__not_found_canary`） | `app/not-found.tsx` | unauth |
| 19 | 共通 | `loading.tsx`（fallback UI） | `app/loading.tsx` | unauth |

> 注: Next.js App Router の route group `(public)` / `(admin)` は URL に現れない。共通 3 は React component file であり実 path ではないが、smoke では「トリガ条件 + Playwright 観測点」を 5 軸に落とす（後続 Phase 2 で詳述）。

## 4. 5 軸の定義

| 軸 | 説明 | Playwright API（代表） |
|----|------|-----------------------|
| **status** | HTTP 応答コード / redirect 期待値 | `response.status()`, `expectRedirectTo: RegExp` |
| **DOM** | 主要 landmark / data-testid 必須要素 | `page.locator(sel).waitFor({ state: 'visible' })` |
| **token** | OKLch token utility が適用された CSS が `getComputedStyle` で観測できる | `page.evaluate(() => getComputedStyle(...))`、または verify-design-tokens 連携 |
| **a11y** | axe-core で `serious` / `critical` violation = 0 | `new AxeBuilder({ page }).analyze()` |
| **interaction** | 必須 1 件の interaction（form submit / link click / sort 等）の smoke 動作 | `page.click()`, `page.fill()`, `page.keyboard.press()` |

## 5. 既存 spec / baseline 棚卸し

- 既存 smoke: `apps/web/playwright/tests/full-smoke.spec.ts`（task-18 由来、17 URL smoke entries + 2 component surfaces data-driven）
- 既存 visual baseline (4 screens):
  - `apps/web/playwright/tests/visual/login.spec.ts`
  - `apps/web/playwright/tests/visual/public-top.spec.ts`
  - `apps/web/playwright/tests/visual/admin-dashboard.spec.ts`
  - `apps/web/playwright/tests/visual/profile.spec.ts`
- 既存 functional: `admin-pages.spec.ts` / `admin-requests.spec.ts` / `profile.spec.ts` / `public-flow.spec.ts` 等
- 残り 15 non-baseline surfaces は visual baseline 未採取 → matrix で `-`（4 baseline 外）と明示

## 6. CI gate 参照

- `playwright-smoke / smoke (chromium)`（task-18 で required check 化）
- `playwright-smoke / visual (chromium, 4 screens)`（task-18 で required check 化）
- `verify-design-tokens / verify-design-tokens`（token 軸の正本検知）

## 7. carry-over 確認

直近 commit `822cc5eb`（task-18）/ `47277a7f`（admin contract stage-2）/ `beef455e`（Phase 12 compliance）等。task-25 の新規作業はこれらの後続として、smoke coverage の文書化のみ。新規 code 変更は出さない。

## 8. 受入条件（Phase 10 で再確認）

1. `SMOKE-COVERAGE-MATRIX.md` が 17 URL smoke entries + 2 component surfaces すべてを行として含む
2. 各行に 5 軸（status / DOM / token / a11y / interaction）すべてのセルが埋まる（`N/A` 含む）
3. 4 visual baseline との関係を明示する列を持つ
4. CI gate job 名（task-18 由来）を参照する section が存在する
5. 既存 spec のファイルパス（正本）が各 route から逆引きできる
