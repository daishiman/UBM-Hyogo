# Phase 11: 手動 / ランタイム視覚検証（VISUAL_ON_EXECUTION）

> 本タスクは `status=implemented_local_runtime_pending` / `visualEvidence=VISUAL_ON_EXECUTION`。
> 本 Phase は execution 時に何を撮るかの**実施計画**を確定する。
> 実 screenshot capture は staging 認証 + staging deploy を要し、すべて user-gated（CONST_002）。
> implemented_local_runtime_pending 時点では **baseline 未生成**であり、Phase 11 evidence の実画像は `n/a`。

## 11.1 証跡方針（VISUAL_ON_EXECUTION 宣言）

| 項目 | 内容 |
| --- | --- |
| タスク種別 | VISUAL（authenticated staging visual regression spec の admin 画面横展開） |
| 証跡方式 | Playwright `toHaveScreenshot` による visual baseline 取得（admin storageState・staging 実機） |
| 現状 | `implemented_local_runtime_pending`（spec 5 本の正本確定まで。実 capture / commit は未実行） |
| 実 capture 状態 | user-gated 未実行（staging 認証 + staging deploy が前提） |
| 代替証跡 | 5 spec の selector / heading を実コード照合（Phase 3 §3.1 検証表）+ 既存基盤の自動認識設計 + 既存雛形 spec との同型性 |

## 11.2 3 層評価の実施計画（execution 時）

| 層 | execution 時に何を検証/撮るか |
| --- | --- |
| Semantic | 各 spec が対象 route の安定 heading（`AdminPageHeader` 由来・常時描画）+ 安定 container selector を `toBeVisible` で待機し、画面到達を意味的に保証する。read-only ガード assertion（dialog / modal / toast の count 0）で副作用未発火を証跡化する |
| Visual | 各画面の read-only 初期表示を `toHaveScreenshot`（`fullPage` / `animations: "disabled"` / `maxDiffPixelRatio: 0.05`）で baseline 化する。初回 `--update-snapshots` で baseline 生成、2 回目以降で回帰検出 |
| AI UX | 取得した 5 baseline を read-only 初期表示として目視レビューし、レイアウト崩れ・トークン逸脱（OKLch 外）・empty/populated 状態の妥当性を確認する。mutation UI（承認/却下・merge・Bulk Resolve 等）が誤って開いていないことを画面で再確認する |

## 11.3 5 画面 撮影計画

| screen | route | screenshot 名（canonical） | 期待視覚状態（read-only 初期表示） | 認証 |
| --- | --- | --- | --- | --- |
| audit | `/admin/audit` | `admin-audit-authenticated.png` | 監査ログ画面の初期描画（`監査ログ` heading + `[data-component="admin-audit"]`）。フィルタ/ログ一覧の read-only 表示 | admin storageState |
| requests | `/admin/requests` | `admin-requests-authenticated.png` | 依頼キュー画面の初期描画（`依頼キュー` heading）。承認/却下の確認 dialog 未表示（count 0） | admin storageState |
| identity-conflicts | `/admin/identity-conflicts` | `admin-identity-conflicts-authenticated.png` | Identity 重複候補画面の初期描画（`Identity 重複候補` heading + `section[data-route="admin"]`）。merge/別人確定の確認フロー未表示 | admin storageState |
| schema | `/admin/schema` | `admin-schema-authenticated.png` | スキーマ差分レビュー画面の初期描画（`スキーマ差分のレビュー` heading + `[data-page="admin-schema"]`）。Bulk Resolve / Bulk Rollback モーダル未表示 | admin storageState |
| meetings | `/admin/meetings` | `admin-meetings-authenticated.png` | 開催日 / 出席管理画面の初期描画（`開催日 / 出席管理` heading + `[aria-label="開催 KPI"]`）。出席操作 toast 未発火（drawer 未操作） | admin storageState |

> canonical screenshot 名は本ファイル / `outputs/phase-11/manual-test-result.md` / 5 spec（Phase 5 §5.2）で **完全一致**（5 名）。
> empty/populated いずれの状態も回帰検出目的では有効な baseline。execution 時に確定する。

## 11.4 baseline / evidence 二重出力（execution 時）

| 種別 | 出力先 | 状態 |
| --- | --- | --- |
| Playwright baseline | `apps/web/playwright/tests/visual-staging-authenticated/<spec>-snapshots/<canonical>-authenticated-staging-visual-{platform}.png` | implemented_local_runtime_pending 時点で未生成（pending / user-gated） |
| Phase 11 evidence copy | `outputs/phase-11/<screenshot名>`（5 名・`page.screenshot` による二重 capture） | implemented_local_runtime_pending 時点で未生成（n/a / user-gated） |

> **実 capture 実行は user-gated。implemented_local_runtime_pending 時点では baseline 未生成**であり、実画像は捏造しない。

## 11.5 実 capture 手順（execution 時 / user-gated）

```bash
# 認識確認（read-only / 副作用なし）
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test --project=staging-visual-authenticated --list

# baseline 初回生成（staging 認証必須 / user-gated）
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test --project=staging-visual-authenticated --update-snapshots
```

## 11.6 Phase 11 完了条件

- [x] VISUAL_ON_EXECUTION を宣言し、3 層評価の実施計画を確定（§11.1 / §11.2）
- [x] 5 画面の撮影計画テーブル（route / canonical 名 / 期待視覚状態 / 認証）を確定（§11.3）
- [x] canonical screenshot 名が本ファイル / manual-test-result.md / spec で一致（5 名）
- [x] 実 capture が user-gated・implemented_local_runtime_pending 時点で baseline 未生成であることを明記
- [ ] （execution 時 / user-gated）5 spec を staging 認証で run し baseline + evidence copy を物理生成
