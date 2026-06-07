# Phase 3: 設計レビュー

> workflow: `issue-1126-bulk-tag-picker-viewport-baseline-expansion`
> 目的: Phase 2 の設計（B案）を 4 条件で評価し、Phase 4（テスト作成）へ進めるかを判定する。

---

## 1. 4 条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| ① 必要性（価値性） | **PASS** | 現行は desktop 単一 baseline のため、mobile / tablet / wide で picker レイアウトが崩れても visual 回帰として検出できない。3 viewport × 2 状態の baseline を追加することで回帰検出範囲を拡大し、レスポンシブ崩れを CI で自動捕捉できる価値がある。コストは spec 1 本 + fixture 1 行 + baseline 6 枚と小さく、価値とコストが釣り合う |
| ② 妥当性（実現性） | **PASS** | B案は同型先例（`admin-members-prototype-redesign.spec.ts` の VIEWPORTS ループ + `setViewportSize` + filename suffix）があり、1 サイクルで実装可能な厚みに収まる。A案（project 複製）との比較で B案優位（§2）。viewport 値は既存 fixture 再利用で新規の数値定義を最小化 |
| ③ 網羅性 | **PASS** | mobile(390×844) / tablet(768×1024) / wide(1920×1080) の 3 viewport × assign/unassign の 2 状態 = 6 baseline で、issue が要求する viewport 範囲を漏れなくカバー。desktop(1280×800) は既存無 suffix baseline で温存され、合計 4 viewport × 2 状態が揃う。read-only（apply 後 result 状態）は本タスク対象外として §N-4 で明示済み（issue-1125 スコープ） |
| ④ 一貫性（整合性） | **PASS** | viewport 値は `viewports.ts` 単一正本に集約（additive）。snapshot 命名は既存 kebab-case + project の `snapshotPathTemplate` 自動 suffix と整合。CI は glob 経由で無改修参加。状態所有権（viewport=fixture / mode=component / baseline=snapshot dir / 回帰=project）が矛盾なく閉じる |

総合判定: **4 条件すべて PASS。Phase 4 へ進行可。**

---

## 2. 代替案比較（A案 project 複製 vs B案 per-test）

| 比較軸 | A案: viewport 別 project 複製 | B案: per-test `setViewportSize` ＋ suffix（採用） |
|--------|-------------------------------|--------------------------------------------------|
| 実装場所 | `playwright.config.ts` に viewport 別 project（`...-mobile/-tablet/-wide`）を複製し、各 project に `snapshotPathTemplate` を定義 | 対象 spec 1 本に viewport ループを追加 + `viewports.ts` に wide 1 行 |
| config への影響 | project 定義が viewport 数だけ増殖（`sidebar-shell-visual-*` / `admin-staging-visual-*` のように肥大） | config 無改修 |
| CI への影響 | 新 project を CI の `--project=...` 起動対象に追加する改修が必要になり得る | yml 無改修（既存 project の glob で自動参加） |
| 既存 desktop 温存 | 別 project になるため、既存 desktop project / 無 suffix baseline との分離管理が必要 | 同一 spec 内に desktop test を残すだけで温存（最小） |
| メンテ面 | viewport 追加のたびに project 複製。設定の重複が増える | viewport 追加は `viewports.ts` + ループ配列の 1 行で済む |
| 失敗時の切り分け | project 名で判別可能 | test 名（`(mobile)` 等）で判別可能（同等） |
| 先例整合 | admin-shell / sidebar-shell 系（route 横断 × viewport の大規模 matrix 向き） | `admin-members-prototype-redesign.spec.ts`（単一画面 × viewport）と同型 |

**結論**: 単一画面（picker）× 3 viewport の小規模 matrix では、config / CI 肥大を避けられる
**B案が優位**。A案は route 横断の大規模 matrix（admin-shell 全 route × 4 viewport 等）でこそ
妥当であり、本タスク規模には過剰。

---

## 3. リスクと対策

| # | リスク | 対策 |
|---|--------|------|
| R-1 | mobile（390 幅）で picker が画面外に出て screenshot に映らない / DOM が unstable | `prepareBulkRegion` で `bulkRegion` の `toBeVisible` を待ってから capture。`toHaveScreenshot` は要素（`bulkRegion`）スコープ撮影のため、viewport 外でもレイアウトはレンダリングされ要素単位で撮れる。必要なら `scrollIntoViewIfNeeded` を追加（実装時に mobile で実測） |
| R-2 | baseline 枚数の肥大（viewport × 状態 × 将来増） | 本タスクは 2 状態（assign / unassign）に限定。apply 後 result 状態（issue-1125）は別スコープで取り込まない。枚数を 6 に固定 |
| R-3 | snapshot 名の suffix drift（desktop に viewport suffix が混入する / 二重 suffix） | desktop は無 suffix 固定（`SNAP.assign/unassign` 定数）。viewport suffix は `-{mobile,tablet,wide}` のみ。project / platform suffix は `snapshotPathTemplate` が自動付与し、spec 側には書かない |
| R-4 | CI 実行時間の増加（3 viewport 追加分） | 単一 project 内の test ループで最小化。project / browser shard は増やさない。新 test は 3 本（各 2 screenshot）に留め、`workers` / `retries` の既存設定を流用 |
| R-5 | mode の state リーク（前 viewport の解除 mode が次 viewport に残る） | viewport ごとに別 test とし、各 test が `prepareBulkRegion`（goto から）で開始。fresh page load の初期状態を assign mode として使い、解除への切替は `switchToUnassignMode(page)` に集約する |
| R-6 | staging tag master が空でレイアウトが空 picker になる | 既存の「付与可能なタグがありません」count 0 assert を `prepareBulkRegion` に内包し、空 picker baseline を防ぐ（前提 §7 と整合） |
| R-7 | `viewports.ts` の wide 追加が既存 consumer を壊す | additive のみ（既存キー・値不変）。`ViewportName` union が自動拡張されるだけで既存参照は無影響（AC-R4） |

---

## 4. 設計確定事項

| # | 確定事項 |
|---|----------|
| D-1 | 採用設計は **B案**（per-test `setViewportSize` + snapshot 名 viewport suffix）。A案（project 複製）は不採用 |
| D-2 | viewport は `viewports.ts` を単一正本とし、`wide: { width: 1920, height: 1080 }` を **additive** 追加。mobile(390×844) / tablet(768×1024) は既存値を再利用 |
| D-3 | desktop(1280×800) は既存無 suffix baseline（`bulk-tag-picker-{assign,unassign}-mode.png`）を **温存**。capture 経路・命名を変えない |
| D-4 | 新規 baseline は 6 枚。命名 `bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png`。project / platform suffix は `snapshotPathTemplate` 自動付与 |
| D-5 | viewport ごとに **別 test** を立て、各 test は `prepareBulkRegion` から開始して fresh assign-mode page を開始点に固定する |
| D-6 | **read-only** 維持。タグ apply なし、各 test で `bulk-tag-result` count 0 を assert。共有 staging D1 への副作用ゼロ |
| D-7 | `playwright.config.ts`（project）・`playwright-staging-visual-authenticated.yml`（CI）は **無改修**。glob 経由で新 baseline が回帰検出に自動参加 |
| D-8 | 変更ファイルは 2 本のみ: 対象 spec（EDIT）+ `viewports.ts`（EDIT）。component / CI / config は非接触 |

判定: **Phase 3 ゲート通過。Phase 4（テスト作成）へ進行可。**
