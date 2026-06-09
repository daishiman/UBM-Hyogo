# Phase 11 — Manual / Runtime Evidence

Status: `runtime_pending`（VISUAL_ON_EXECUTION）

## VISUAL_ON_EXECUTION 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | VISUAL（authenticated staging visual regression spec の admin 画面横展開） |
| 現状 | `implemented_local_runtime_pending`（spec 5 本は local 実装済。プロダクトコード・D1・CI 不変） |
| 実 capture 状態 | user-gated 未実行（staging 認証 + staging deploy が前提） |
| 代替証跡 | (a) 5 spec の selector/heading 実コード照合 (b) 既存基盤の自動認識設計 (c) 既存雛形 spec との同型性 |

本タスクの証跡主ソースは **認証付き staging Playwright run**（`staging-visual-authenticated` project）である。
本 wave は spec の local 実装（`implemented_local_runtime_pending`）までであり、staging 実行は行っていない。
よって実 screenshot は**現時点で未生成 = n/a** であり、本ファイルは PASS ではなく runtime pending の ledger とする。
実画像の捏造は行わない。

## 1. 代替証跡（implemented_local_runtime_pending 時点の静的検証）

実 capture が user-gated のため、以下を主ソースとして spec 設計の妥当性を静的に担保する。

### (a) 5 spec の selector / heading 実コード照合

| route | spec file | heading（getByRole） | 安定 container selector | read-only ガード |
| --- | --- | --- | --- | --- |
| `/admin/audit` | `admin-audit-authenticated.spec.ts` | `監査ログ` | `[data-component="admin-audit"]` | — |
| `/admin/requests` | `admin-requests-authenticated.spec.ts` | `依頼キュー` | （filter region 常時） | `dialog` count 0（承認/却下確認 未表示） |
| `/admin/identity-conflicts` | `admin-identity-conflicts-authenticated.spec.ts` | `Identity 重複候補` | `section[data-route="admin"]` | `dialog` count 0（merge/別人確定 未表示） |
| `/admin/schema` | `admin-schema-authenticated.spec.ts` | `スキーマ差分のレビュー` | `[data-page="admin-schema"]` | Bulk Resolve / Bulk Rollback modal count 0 |
| `/admin/meetings` | `admin-meetings-authenticated.spec.ts` | `開催日 / 出席管理` | `[aria-label="開催 KPI"]` | attendance toast count 0（drawer 未操作） |

> heading / selector は実コードで検証済み（Phase 3 §3.1 検証表・2026-06-07）。

### (b) 既存基盤の自動認識設計

`staging-visual-authenticated` project は `testDir` + path glob で新規 spec を自動認識する。
5 spec を `apps/web/playwright/tests/visual-staging-authenticated/` 配下に置くだけで project に組み込まれるため、
`playwright.config.ts` / CI workflow の編集は不要（execution 時に `--list` で認識確認）。

### (c) 既存雛形 spec との同型性

`admin-tags-authenticated.spec.ts`（既存雛形）と同型構造（admin storageState 注入 → goto → heading 待機 →
read-only ガード assertion → `toHaveScreenshot` → `outputs/phase-11/` への二重 capture）で 5 本を作成する。
雛形が staging で稼働実績を持つため、同型 spec の構造妥当性が担保される。

## 2. screenshot を今作らない理由（runtime pending / user-gated）

以下が揃わないと baseline を取得できないため、すべて user 承認後に実施する（CONST_002）:

- `status=implemented_local_runtime_pending`（本 wave は spec local 実装まで。実 capture は範囲外）
- 認証付き staging のデプロイ（最新 dev の機能本体が staging に反映済みであること）
- admin secrets（`admin.storageState.json` を mint するための認証情報）
- baseline 初回生成（`--update-snapshots` を伴う初回 run は人手承認が必要）
- 生成 baseline / evidence copy の commit / push

## 3. 5 画面の期待視覚状態

| screen | route | canonical screenshot 名 | 期待視覚状態（read-only 初期表示） |
| --- | --- | --- | --- |
| audit | `/admin/audit` | `admin-audit-authenticated.png` | 監査ログ画面の初期描画。フィルタ + ログ一覧の read-only 表示 |
| requests | `/admin/requests` | `admin-requests-authenticated.png` | 依頼キュー画面の初期描画。承認/却下確認 dialog 未表示 |
| identity-conflicts | `/admin/identity-conflicts` | `admin-identity-conflicts-authenticated.png` | Identity 重複候補画面の初期描画。merge/別人確定フロー未表示 |
| schema | `/admin/schema` | `admin-schema-authenticated.png` | スキーマ差分レビュー画面の初期描画。Bulk Resolve/Rollback モーダル未表示 |
| meetings | `/admin/meetings` | `admin-meetings-authenticated.png` | 開催日 / 出席管理画面の初期描画。出席操作 toast 未発火 |

> empty/populated いずれも回帰検出目的では有効な baseline（execution 時に確定）。

## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| screenshot | outputs/phase-11/admin-audit-authenticated.png | n/a |
| screenshot | outputs/phase-11/admin-requests-authenticated.png | n/a |
| screenshot | outputs/phase-11/admin-identity-conflicts-authenticated.png | n/a |
| screenshot | outputs/phase-11/admin-schema-authenticated.png | n/a |
| screenshot | outputs/phase-11/admin-meetings-authenticated.png | n/a |

> `Status=n/a` の screenshot 行は `implemented_local_runtime_pending` 時点で baseline 未生成（実 capture は user-gated）。
> 実 capture 実行時に物理 file を生成し、`Status` を `present` へ更新する。

## 4. 実 capture 手順（execution 時 / user-gated）

```bash
# 認識確認（read-only / 副作用なし）
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test --project=staging-visual-authenticated --list

# baseline 初回生成（staging 認証必須 / user-gated）
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test --project=staging-visual-authenticated --update-snapshots
```

初回 `--update-snapshots` で baseline を生成し、2 回目以降は外して回帰検証する。
各 spec は execution 時に `outputs/phase-11/<screenshot名>` へ二重 capture する。

## 5. 併走する静的検証（local / user-gated でない範囲）

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| 型チェック | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| Playwright 登録確認 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --list` | PASS（13 tests in 11 files。新 spec 5 test + setup/teardown を検出） |

runtime screenshot 取得は user-gated のため未実行。
