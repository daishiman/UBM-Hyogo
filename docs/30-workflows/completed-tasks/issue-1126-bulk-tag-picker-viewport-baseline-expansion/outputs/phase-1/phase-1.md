# Phase 1: 要件定義

> workflow: `issue-1126-bulk-tag-picker-viewport-baseline-expansion`
> 親 issue: #1077（completed・`issue-1077-bulk-tag-authenticated-staging-visual`）の follow-up
> implementation_mode: `new`（新規 Playwright spec 編集を伴う）
> workflow_state: `implemented_local_runtime_pending`（本実行サイクルで実装済み）
> visual 区分: `VISUAL_ON_EXECUTION`（実装実行時に新規 baseline PNG を撮る）
> issue 状態方針: #1126 は CLOSED のまま reopen しない。コミット/PR では `Refs #1126` のみ付与する。

---

## 1. タスク概要

bulk tag picker（`/admin/members` の「一括操作」リージョン内「タグ一括付与・解除」picker）の
authenticated staging visual baseline を、現状の desktop 単一 viewport から
**mobile / tablet / wide の 3 viewport へ拡張**する。

現行 `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
は project default の desktop（1280×800）だけで picker の assign / unassign baseline を撮っている。
レスポンシブ崩れ（picker のグリッド折返し・ボタン整列・スクロール領域など）が
mobile / tablet / wide で発生しても、現行構成では visual 回帰として検出できない。

本タスクは、同一 spec 内で `page.setViewportSize()` を切り替えながら 3 viewport ×
assign/unassign の **新規 baseline 6 枚** を追加し、既存 desktop baseline を温存したまま
回帰検出範囲を広げる。read-only capture（タグを apply しない）を維持し、
共有 staging D1 への副作用はゼロとする。

| 項目 | 値 |
|------|-----|
| 対象画面 | `/admin/members` 一括操作リージョン内 tag picker |
| 対象 component | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` |
| 対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 対象 CI | `.github/workflows/playwright-staging-visual-authenticated.yml`（無改修） |
| 追加 baseline | 6 枚（mobile / tablet / wide × assign / unassign） |
| 既存 baseline | 2 枚（desktop assign / unassign・**温存**） |

---

## 2. 実装区分判定（CONST_004）

| 判定軸 | 結果 |
|--------|------|
| docs-only か | **No** — 目的達成に Playwright spec とフィクスチャの **コード編集が必須** |
| 実装ファイルを変更するか | **Yes** — spec 1 本 + viewports fixture 1 本を編集 |
| 実装区分 | **実装仕様書** |

issue のラベルは `type:improvement` だが、CONST_004 の判定は「ラベル」ではなく
「目的達成にコード編集が必要か」で行う。本タスクは以下 2 ファイルの編集が成立条件であり、
docs-only では達成不能なため **実装仕様書** として扱う。

1. EDIT `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
   （viewport ループの追加。既存 desktop capture は保持）
2. EDIT `apps/web/playwright/fixtures/viewports.ts`
   （`wide: { width: 1920, height: 1080 }` を additive 追加）

> なお新規 baseline PNG 6 枚は spec 実行時に Playwright が生成する成果物であり、
> 本仕様書（implemented_local_runtime_pending）段階では生成しない。VISUAL_ON_EXECUTION として本実行サイクルで実装済み。

---

## 3. issue 調査結論（未解決の根拠）

調査日: 2026-06-06。結論: **未実装**（他タスクによる重複解決なし）。

| 確認軸 | 現行コードの実測 | 判定 |
|--------|------------------|------|
| 対象 spec の viewport 構成 | `admin-members-bulk-tag-authenticated.spec.ts` は project default（1280×800）の desktop 単一。`page.setViewportSize()` の呼び出しなし | desktop のみ・未拡張 |
| snapshot 名 | `SNAP.assign = bulk-tag-picker-assign-mode.png` / `SNAP.unassign = bulk-tag-picker-unassign-mode.png` の 2 つのみ（無 viewport suffix） | mobile/tablet/wide baseline 不在 |
| viewport fixture | `apps/web/playwright/fixtures/viewports.ts` は `desktop 1280×800` / `tablet 768×1024` / `mobile 390×844` の 3 つ。`wide` 不在 | wide 値の追加が必要 |
| CI project の viewport matrix | `staging-visual-authenticated` project（`playwright.config.ts`）は `viewport: { width: 1280, height: 800 }` 単一。viewport 別の複製 project なし | matrix 不在 |
| sibling 重複解決 | issue-1125（result mutation baseline）/ issue-1080 / issue-1081 はいずれも別スコープ。picker の viewport 拡張を扱うタスクは存在しない | 重複なし |

上記より、bulk tag picker の mobile/tablet/wide baseline は**どのタスクでも未取得**であり、
本タスクが新規に成立する。

---

## 4. issue の現行コードへの最適化

issue 記述を現行コード事実に合わせ、以下 3 点で最適化する。

1. **viewport 値を既存 fixture と整合させる**
   issue は「mobile / tablet / wide」とだけ記す。現行 `viewports.ts` が
   `mobile 390×844` / `tablet 768×1024` を既に正本として持つため、これを**再利用**し、
   独自の mobile/tablet 値を spec 内に再定義しない。不足する `wide` のみ
   `wide: { width: 1920, height: 1080 }` を fixture に additive 追加し、単一正本に集約する。
   （desktop は既存 project default 1280×800 を無 suffix baseline として温存し、fixture 上も既存値を変えない）

2. **採用設計を B案（per-test viewport 切替）に確定する**
   sibling の `admin-members-prototype-redesign.spec.ts` が既に
   `VIEWPORTS` ループ + `page.setViewportSize()` + ファイル名 viewport suffix の同型を実装済み。
   この先例と整合させ、A案（viewport 別 project 複製。`sidebar-shell-visual-*` /
   `admin-staging-visual-*` 系のような config 複製）は**不採用**とする。
   理由は §5 / Phase 3 で詳述（メンテ面増・config 肥大）。

3. **CI を無改修にする**
   `playwright-staging-visual-authenticated.yml` は `staging-visual-authenticated` project を
   `--project=staging-visual-authenticated` で起動し、project はファイル glob
   （`testDir: ./playwright/tests/visual-staging-authenticated`）で spec を拾う。
   既存 spec を編集して baseline を追加するだけで、新 baseline は自動的に回帰検出に参加する。
   CI ワークフロー・project 定義の変更は不要。

---

## 5. スコープ（CONST_007: 1サイクル内完了）

### 含む

| # | 項目 |
|---|------|
| S-1 | `viewports.ts` に `wide: { width: 1920, height: 1080 }` を additive 追加 |
| S-2 | 対象 spec に `RESPONSIVE_VIEWPORTS`（mobile / tablet / wide）ループを追加 |
| S-3 | 各 viewport で assign mode → `toHaveScreenshot('bulk-tag-picker-assign-mode-<vp>.png')` |
| S-4 | 各 viewport で解除 mode に切替 → `toHaveScreenshot('bulk-tag-picker-unassign-mode-<vp>.png')` |
| S-5 | 既存 desktop（無 suffix）baseline 2 枚の温存（コード上の capture 経路を壊さない） |
| S-6 | read-only 維持（`bulk-tag-result` count 0 assert・タグ apply なし） |

### 含まない（先送りなし宣言）

| # | 項目 | 理由 |
|---|------|------|
| N-1 | desktop baseline の再撮影・命名変更 | 既存 baseline 温存が AC③。無 suffix を固定する |
| N-2 | A案（viewport 別 project 複製）への config 改修 | B案を採用（Phase 3 比較）。config 肥大を避ける |
| N-3 | CI ワークフロー（yml）の改修 | glob 経由で自動参加するため不要（§4-3） |
| N-4 | result mutation（タグ apply 後）状態の baseline | issue-1125 の別スコープ。read-only 維持 |
| N-5 | component（`BulkActionBar.tsx`）のレスポンシブ実装変更 | 本タスクは baseline 取得のみ。実装変更は範囲外 |

> 本スコープは 1 サイクル内（spec 1 本 + fixture 1 本の編集 + baseline 6 枚生成）で完結する。
> 上記「含まない」項目に先送り（後続タスクへの暗黙的依存）はない。N-4 / N-5 は
> 本タスクの目的（picker レイアウトの viewport 回帰検出）に不要なため恒久的にスコープ外とする。

---

## 6. 受け入れ基準（issue AC の現行コード展開）

issue #1126 の原文 AC 4 点を現行コードに即して展開する。

| AC | issue 原文 | 現行コード展開 |
|----|-----------|----------------|
| AC① | mobile / tablet / wide で picker assign/unassign baseline を取得 | `RESPONSIVE_VIEWPORTS = [mobile(390×844), tablet(768×1024), wide(1920×1080)]` を `page.setViewportSize()` で切替え、各 viewport で `bulkRegion` の assign / unassign 2 状態を `toHaveScreenshot` で撮る |
| AC② | viewport ごとに baseline を分離（`-mobile` / `-tablet` / `-wide` suffix） | snapshot 名を `bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png` とし、6 枚を viewport 別ファイルへ分離する |
| AC③ | 既存 desktop baseline を破壊しない | 既存 `SNAP.assign = bulk-tag-picker-assign-mode.png` / `SNAP.unassign = bulk-tag-picker-unassign-mode.png`（無 suffix）の capture を温存。viewport suffix を desktop には付けない |
| AC④ | CI で新 baseline が回帰検出に組込まれる | `staging-visual-authenticated` project が glob で spec を拾うため、新 baseline を commit するだけで `playwright-staging-visual-authenticated.yml` の回帰検出に自動参加。CI 改修不要 |

### 補助受け入れ基準（既存不変条件の維持）

| # | 基準 |
|---|------|
| AC-R1 | read-only 維持: タグ apply を行わず、`page.getByTestId('bulk-tag-result')` の count が 0 であること |
| AC-R2 | 共有 staging D1 への mutation 副作用がゼロであること |
| AC-R3 | viewport ループの各イテレーション開始時に assign mode へ戻し（mode の state 永続に対処）、状態リークがないこと |
| AC-R4 | `viewports.ts` の既存 export（`VIEWPORTS` / `ViewportName`）の互換を壊さず additive であること |

---

## 7. 前提条件・依存

| 区分 | 内容 |
|------|------|
| 依存タスク | 親 #1077（completed）。既存 spec / storageState mint 機構（`mint-staging-storage-state.ts`）/ project 定義（`staging-visual-authenticated`）が稼働済みであること |
| 認証前提 | `test.use({ storageState: .../.auth/admin.storageState.json })`。CI では `setup-authenticated-staging` project が storageState を ephemeral に mint → 消費 → teardown |
| staging データ前提 | staging tag master が picker baseline として意味を持つよう、最低 1 件のタグを公開していること（既存 spec が「付与可能なタグがありません」count 0 で担保） |
| 既存 DOM 操作前提 | `/admin/members` goto(networkidle) → heading「会員管理」visible → `tbody input[type="checkbox"]` の nth(0)/nth(1) を check → region「一括操作」内 region「タグ一括付与・解除」表示 → animations 無効化 → screenshot。mode 切替は group「付与モード」内 button「解除」/「付与」を click（`aria-pressed` で確認） |
| 環境前提 | CI secrets（`STAGING_AUTH_SECRET` 等）が `staging-visual-authenticated` environment に投入済みのとき実行。未投入 PR では graceful skip（既存 yml の secrets-gate 仕様） |
| 命名規則 | 既存 baseline は kebab-case + 無 suffix。新規は同 kebab-case に `-{mobile,tablet,wide}` suffix を付与。Playwright が project/platform suffix（`-authenticated-staging-visual-chromium-linux`）を `snapshotPathTemplate` 経由で自動付与する（Phase 2 §3 で詳述） |
| スコープ外依存なし | §5 N-1〜N-5 に先送り依存なし。本タスク完了で AC①〜④ が閉じる |
