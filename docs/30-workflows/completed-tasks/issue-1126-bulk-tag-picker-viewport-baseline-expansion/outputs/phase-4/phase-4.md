# Phase 4: テスト計画

`[実装区分: 実装仕様書]` / `implementation_mode: edit` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Issue #1126「bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide）」のテスト計画フェーズ。
本タスクは **visual regression baseline の追加**であり、新規 unit / component test は作らない。
visual baseline 自体が Playwright の比較テスト（`toHaveScreenshot`）として機能する。
既存 component test `BulkActionBar.spec.tsx` が無改修で PASS することを回帰保証として固定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| issue | #1126（CLOSED 維持 / `Refs #1126`） |
| phase | 4（テスト計画） |
| 採用設計 | B案（既存 spec 内で `page.setViewportSize()` を切替し各 viewport で baseline 取得） |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts`（`wide` を additive 追加） |
| 回帰保証（変更しない） | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` |
| CI（無改修） | `.github/workflows/playwright-staging-visual-authenticated.yml` |
| 起点 spec の workflow | issue-1077（authenticated staging bulk tag picker visual baseline） |

## 目的

既存の desktop（1280×800 = project default）1 viewport × assign/unassign 2状態の baseline に対し、
mobile（390×844）/ tablet（768×1024）/ wide（1920×1080）の 3 viewport を追加し、
**4 viewport × 2状態 = 計 8 baseline（既存 2 温存 + 新規 6）**で responsive レイアウト退行を検出可能にする。
read-only（タグを apply しない）原則は維持し、staging データへの副作用ゼロを保証する。

## 1. テスト戦略

本タスクは **visual regression baseline 拡張**であり、TDD の RED/GREEN サイクルを持たない。
テスト戦略は次の 3 層で構成する。

| 層 | 内容 | 役割 |
| --- | --- | --- |
| visual regression（主） | Playwright `toHaveScreenshot()` を新規 6 枚 + 既存 2 枚で実行。baseline は user-gated の `--update-snapshots` で確定 | responsive レイアウト退行の検出（本タスクの本体） |
| component test（回帰保証） | 既存 `BulkActionBar.spec.tsx` を無改修で実行 | bulk action bar / picker のモード切替・選択挙動が壊れていないことの回帰保証 |
| read-only 不変条件（副作用ゼロ） | capture 後に `getByTestId('bulk-tag-result')` が `toHaveCount(0)` | tag を apply せず staging データを汚さないことの保証 |

> 新規 unit / component test は作らない（CONST_005: 不要な新規ファイルを増やさない）。
> visual baseline の比較アサーション自体が、本タスクの追加テストである。

## 2. テスト対象一覧

| テスト種別 | 対象 | 実行コマンド | 期待 |
| --- | --- | --- | --- |
| visual（新規・mobile） | assign-mode × mobile（390×844） | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated` | `bulk-tag-picker-assign-mode-mobile.png` が baseline と一致（`maxDiffPixelRatio: 0.05`） |
| visual（新規・mobile） | unassign-mode × mobile（390×844） | 同上 | `bulk-tag-picker-unassign-mode-mobile.png` が一致 |
| visual（新規・tablet） | assign-mode × tablet（768×1024） | 同上 | `bulk-tag-picker-assign-mode-tablet.png` が一致 |
| visual（新規・tablet） | unassign-mode × tablet（768×1024） | 同上 | `bulk-tag-picker-unassign-mode-tablet.png` が一致 |
| visual（新規・wide） | assign-mode × wide（1920×1080） | 同上 | `bulk-tag-picker-assign-mode-wide.png` が一致 |
| visual（新規・wide） | unassign-mode × wide（1920×1080） | 同上 | `bulk-tag-picker-unassign-mode-wide.png` が一致 |
| visual（既存・温存） | assign-mode × desktop（1280×800） | 同上 | `bulk-tag-picker-assign-mode.png`（無 suffix）が**不変**で一致 |
| visual（既存・温存） | unassign-mode × desktop（1280×800） | 同上 | `bulk-tag-picker-unassign-mode.png`（無 suffix）が**不変**で一致 |
| component（回帰保証） | `BulkActionBar.spec.tsx` | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 既存ケース全 PASS（無改修） |
| read-only（副作用ゼロ） | `getByTestId('bulk-tag-result')` | 上記 Playwright 実行内で評価 | `toHaveCount(0)`（tag を apply していないこと） |

> 既存 desktop baseline は**ファイル名・内容ともに不変**。新規 viewport 追加で既存 2 枚の比較結果が
> 変わってはならない（desktop は viewport を切り替える前の最初の capture で取得するため不変が保証される）。

## 3. 実行前提と自動化

visual baseline の取得・比較は staging 認証済み環境を前提とし、以下の自動化前提に依存する。

| 前提 | 内容 |
| --- | --- |
| storageState mint | `test.use({ storageState: .auth/admin.storageState.json })` を起点 spec が既に使用。admin storageState を CI / ローカルで事前 mint する（既存 issue-1077 経路を踏襲） |
| staging secrets | `STAGING_*`（staging base URL / admin 認証用）が必要。ローカルでは 1Password 経由（`scripts/with-env.sh`）で注入。CI では GitHub Secrets |
| project 指定 | `--project=staging-visual-authenticated`（既存 Playwright project）。desktop の 1280×800 はこの project の default viewport |
| web server skip | staging（リモート）を直接叩くため `PLAYWRIGHT_SKIP_WEB_SERVER` 等でローカル dev server 起動を抑止（既存 CI 設定に準拠） |
| baseline 確定 | 新規 6 枚は user-gated。`--update-snapshots` を付与して初回 baseline を生成（ユーザー明示承認後のみ実行） |
| CI 無改修 | `.github/workflows/playwright-staging-visual-authenticated.yml` は変更しない。既存 job が新規 baseline も比較対象に自動包含する |

> Playwright staging spec の実行はすべて **user-gated**（staging secrets 必須・実環境アクセス）。
> Claude Code はローカル `typecheck` / `lint` までを自律実行し、実 capture はユーザー承認後に限る。

## 4. テストデータ前提

staging 環境のデータが以下を満たすことが、意味のある picker baseline 取得の前提となる。

| データ前提 | 内容 | 検証方法（spec 内） |
| --- | --- | --- |
| tag master に最低1タグ | picker が「付与可能なタグがありません」空状態でないこと | 起点 spec 既存: `tagPicker.getByText("付与可能なタグがありません")` が `toHaveCount(0)` |
| member 行が2行以上 | 一括選択 UI（bulk action bar / picker）を露出させるため、最低2行を選択できること | 起点 spec 既存: `memberCheckboxes.nth(1)` が `toBeVisible`（2行目チェックボックスの存在確認） |
| 認証済み admin セッション | `/admin/members` にアクセスでき「会員管理」見出しが見えること | 起点 spec 既存: `getByRole("heading", { name: "会員管理" })` が `toBeVisible` |

> これらは起点 spec（issue-1077）が既に検証している前提であり、viewport 拡張では追加のデータ前提を増やさない。
> viewport を変えても同じ選択状態・同じ tag master を使い回すため、データ前提は viewport 数に依存しない。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | desktop capture の直後に responsive ループを追加 |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` | `wide` viewport を additive 追加 |
| 回帰保証テスト | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 無改修 PASS の回帰保証 |
| CI ワークフロー | `.github/workflows/playwright-staging-visual-authenticated.yml` | 無改修（既存 job が新 baseline を自動包含） |
| Phase 2 設計 | `../phase-2/phase-2.md` | B案 viewport 切替設計 |
| Phase 3 レビュー | `../phase-3/phase-3.md` | flaky / read-only リスクレビュー |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-4/phase-4.md` | テスト戦略（visual / component 回帰 / read-only の 3 層）、テスト対象一覧（新規 6 + 既存 2 + component + read-only）、実行前提（storageState / staging secrets / project / web server skip / baseline 確定）、テストデータ前提（tag master ≥1 / member ≥2行） |

## 統合テスト連携

- 本 Phase の visual baseline は Phase 11 で user-gated capture の対象（VISUAL_ON_EXECUTION）。
- component 回帰保証（`BulkActionBar.spec.tsx`）は Phase 5 実装後のローカル検証で PASS を確認する。
- read-only 不変条件（`bulk-tag-result` count 0）は Phase 6 で visual assertion とともに固定する。
- result mutation 後の状態（partial-failure 等）の baseline は issue-1125 が担当し、本タスクのスコープ外（Phase 7 で再掲）。

## 完了条件（Phase 4）

- visual / component 回帰 / read-only の 3 層テスト戦略を確定した。
- 新規 6 baseline・既存 2 baseline 不変・component 回帰・read-only 副作用ゼロのテスト対象一覧を確定した。
- storageState mint / staging secrets / project 指定 / web server skip / baseline 確定（`--update-snapshots`）の実行前提を確定した。
- tag master ≥1 タグ・member ≥2行のテストデータ前提を確定した。
