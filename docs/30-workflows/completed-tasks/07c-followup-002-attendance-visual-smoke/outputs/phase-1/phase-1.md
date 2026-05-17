# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 1. 目的

Issue #313 (07c-followup-002) で要求された attendance UI の visual evidence を
Playwright で取得し、07c 本体の NON_VISUAL 判定を解消する。
あわせて、既存 `attendance.spec.ts` の `TODO(08b)` 残留・page-object selector drift・
mock API endpoint 不足を同サイクルで解消する（CONST_007 先送り禁止）。

## 2. スコープ

### 2.1 In scope

- `/admin/meetings/[id]` detail page の attendance candidates / register / duplicate flow
- `/admin/meetings` list page (`MeetingPanel`) の attendance add / delete flow
- `attendance.spec.ts` の TODO 解消・新規 spec 追加
- `AdminMeetingsPage` page object の selector 整合・新規メソッド追加
- standalone mock API と実 API への `/admin/meetings/:id` detail endpoint 追加
- evidence 保存パスの canonical 化（`outputs/phase-11/`）
- `playwright-smoke.yml` への focused attendance smoke step 配線

### 2.2 Out of scope

- D1 schema 変更を伴う API schema 変更（INV-01）。Web detail page が既に依存していた `GET /admin/meetings/:id` の実装欠落は in scope として同サイクル内で解消する。
- D1 schema 変更（INV-02）
- 新規 design token / OKLch 値の追加（INV-03）
- staging 実機 deploy・staging smoke（別タスク 09a の責務）
- attendance とは無関係な admin 画面の visual baseline 更新（INV-06）
- detail page への delete ボタン**実装**（後述「設計判断 D-1」で Phase 2 決定。新規 UI 実装を伴う場合は本タスクに含めるが、attendance delete API の schema 変更は行わない）

## 3. 現状調査（事前 evidence）

### 3.1 detail page UI: `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`

- `data-testid="attendance-candidate"` / `data-testid="attendance-register"` / `data-testid="toast"` を持つ
- candidates は `isDeleted=true` を `.filter` で除外（クライアント側 二重防御）
- 重複登録時: `setToast("既に出席登録済み")` + 409 path で同一 toast
- **delete UI は detail page に存在しない**（register 専用）
- 登録済み member は filter されず一覧に残る（button click 時に toast）

### 3.2 list page UI: `apps/web/src/components/admin/MeetingPanel.tsx`

- session ごとに `<select>` で候補表示。既登録は `option disabled` + "出席済"
- 削除ボタン `data-testid` 未付与（"削除" テキストの `<button>` のみ）
- delete 成功時 `setToast("出席を削除しました")` + `setAttended` 更新

### 3.3 既存 spec: `apps/web/playwright/tests/attendance.spec.ts`

```text
// TODO(08b): 実装は Phase 11 manual smoke で活性化
- 重複登録 → toast 表示
- 削除済み member は候補に出ない
```

→ TODO comment 残留、登録済み member の test なし、delete flow の test なし。

### 3.4 page object: `apps/web/playwright/page-objects/AdminMeetingsPage.ts`

- `attendanceCandidates` / `dupToast` / `registerAttendance` / `expectDupToast` / `expectDeletedMemberExcluded` を持つ
- selector はすべて detail page に存在（list page では機能しない）
- delete / 既登録判定の helper メソッドが未実装

### 3.5 standalone mock: `apps/web/playwright/fixtures/auth.ts`

- 現在 `/admin/meetings` / `/admin/meetings/:id` endpoint なし → SSR fetch が 404
- attendance POST attended=true/false endpoint なし
- mock state を切替える HTTP control endpoint も未整備（attendance 領域に限る）

### 3.6 CI: `.github/workflows/playwright-smoke.yml`

- `pnpm e2e:smoke` で `--project=desktop-chromium` を実行
- `attendance.spec.ts` は smoke project に既に含まれる（playwright.config の testMatch 経由・後で確認）

## 4. 受入条件（AC）の検証可能な分解

| ID | 受入条件 | 検証手段 | 期待 evidence |
|----|----------|---------|---------------|
| AC-1 | 削除済み member が candidates panel に出ない | Playwright spec: `attendance-candidate[data-member="m-5"]` count=0 を assert | screenshot `attendance-deleted-excluded.png` |
| AC-2 | 登録済み member が candidates panel で "登録済" 状態 | Playwright spec: `attendance-register[data-member="m-1"][disabled]` または toast assert | screenshot `attendance-already-registered.png` |
| AC-3 | duplicate add 時 toast 表示 | Playwright spec: 同 member を 2 回 click → `toast` visible "既に出席登録済み" | screenshot 連番 `attendance-dup-(1\|2).png` |
| AC-4 | delete 後 attendance state 更新 | Playwright spec: list page で remove click → `attendees` から消失 + toast "出席を削除しました" | screenshot 連番 `attendance-delete-(before\|after).png` + trace `attendance-delete-trace.zip` |
| AC-5 | evidence canonical path | `git ls-files docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/` が `.png` `.txt` `.json` を含む | tracked file list |
| AC-6 | spec un-skip 完成 | `grep -c "test.describe.skip\|test.skip(true\|test.fixme\|TODO(08b)" apps/web/playwright/tests/attendance.spec.ts` = 0 | `outputs/phase-11/e2e-skip-count.txt` |
| AC-7 | CI smoke 配線 | `playwright-smoke / smoke (chromium)` job が existing route smoke 後に focused attendance visual smoke を実行する | workflow diff + local `e2e-run.txt`; GH Actions run log は commit / push / PR 後の user-gated evidence |
| AC-8 | `verify:tokens` PASS | `pnpm verify:tokens` 緑（新規 UI 追加時の HEX 直書き防止） | `outputs/phase-11/verify-design-tokens.txt` |
| AC-9 | provenance 明記 | `phase11-capture-metadata.json.provenance = "local-mock"` | tracked JSON |

## 5. 実装 mode 判定

`task-specification-creator` の判定マトリクスに当てはめると:

| 判定軸 | 値 |
|--------|-----|
| 実装区分 | 実装仕様書（コード変更を必ず伴う） |
| testCategory | e2e (Playwright) + visual |
| VISUAL / NON_VISUAL | VISUAL |
| screenshot 実行 mode | local mock-screenshot 経路（staging 不在時の暫定 canonical） |
| 経路許容条件（phase-11-screenshot-guide §「VISUAL タスクの local mock-screenshot 経路」） | 4 件すべて満たす（後述 5.1） |
| Phase 11 evidence_status 目標 | `captured` |

### 5.1 local mock-screenshot 経路 許容条件チェック

| # | 条件 | 本タスクでの満たし方 |
|---|------|-----------------------|
| 1 | staging 実機 smoke が別タスクで分離・user 承認済み | 09a staging smoke が責務として既に切り出されている（07c task に明記） |
| 2 | mock は standalone HTTP server | `apps/web/playwright/fixtures/auth.ts` の `ensureMockApi()` を拡張（page.route() を使わない） |
| 3 | SSR fetch 経路は standalone mock 経由 | `fetchAdmin<MeetingDetail>` が `INTERNAL_API_BASE_URL` 経由で standalone mock に到達することを Phase 4 で確認 |
| 4 | `provenance: local-mock` を metadata に明記 | AC-9 / `phase11-capture-metadata.json` で固定 |

## 6. 設計判断ポイント（Phase 2 へ送る）

| ID | 論点 | Phase 1 暫定方針 |
|----|------|-------------------|
| D-1 | detail page (`/admin/meetings/[id]`) に delete ボタンが未実装。AC-4 をどこで満たすか | **list page (`/admin/meetings`)** の `MeetingPanel` で AC-4 を取得する（既存 UI に delete ボタンが存在）。detail page 側に delete を追加しない（新規 API endpoint 不要・UI 拡張範囲も最小） |
| D-2 | mock API の `/admin/meetings` / `/admin/meetings/:id` データ shape | `MeetingsListView` / `MeetingDetail` の minimum shape を fixture builder として `apps/web/playwright/fixtures/admin-meetings.ts` に新設 |
| D-3 | duplicate add で 409 を mock がどう返すか | mock state `attendance: Record<sessionId, Set<memberId>>` を持ち、POST 2 回目で 409 + body `{ error: "attendance_already_recorded" }` を返す |
| D-4 | delete 後 state を SSR 再 fetch で反映するか、CSR 楽観更新のみで撮影するか | list page (`MeetingPanel`) は CSR 楽観更新 (`setAttended`) で更新するため、screenshot は CSR state で撮る（`router.refresh()` は detail 系のみ） |
| D-5 | visual baseline 追加の要否 | 追加しない（INV-06）。screenshot は evidence 専用パス `outputs/phase-11/screenshots/` に保存し、`*-snapshots/` baseline には組み入れない |

## 7. 影響範囲（事前見積もり）

| 区分 | パス | 想定変更 |
|------|------|----------|
| edit | `apps/web/playwright/tests/attendance.spec.ts` | TODO 削除・AC-1〜4 のテスト追加 |
| edit | `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | list page 用の locator / メソッド追加（既存 selector は detail page 用として保持） |
| edit | `apps/web/playwright/fixtures/auth.ts` | `/admin/meetings(/:id)?` GET, attendance POST attended=true/false endpoint + mock state |
| new | `apps/web/playwright/fixtures/admin-meetings.ts` | fixture builder (`buildMeetingDetail` / `buildMeetingsList`) |
| edit | `apps/web/playwright/playwright.config.ts` | 必要なら trace capture を attendance.spec.ts で `on` 化（既存設定で十分なら触らない） |
| evidence | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/` | screenshots / `.txt` / `.json` evidence |
| CI | `.github/workflows/playwright-smoke.yml` | existing smoke project は `full-smoke.spec.ts` 固定のため、focused attendance visual smoke step を追加する |

## 8. 要件チェックリスト

- [ ] AC-1〜AC-9 がすべて Phase 11 evidence で証明できる
- [ ] INV-01〜INV-10 がすべて Phase 11 / Phase 12 evidence で監査可能
- [ ] D-1〜D-5 すべての設計判断が Phase 2 で確定する
- [ ] 1 行実行コマンドが `mise exec --` 経由で固定（quality-gates §7.1）

## 9. 次フェーズ引き継ぎ

Phase 2 で確定すべき項目（最低限）:

1. 変更対象ファイル一覧（new/edit/delete 完全列挙）
2. page object 新規メソッドのシグネチャ
3. spec test 名・対象 viewport
4. mock API 拡張の URL / body schema
5. evidence canonical path 一覧
6. 1 行実行コマンド
7. CI 配線（path-filter / smoke project への組み込み）
