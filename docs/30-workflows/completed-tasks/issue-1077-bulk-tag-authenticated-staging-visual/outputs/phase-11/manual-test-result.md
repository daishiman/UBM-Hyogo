# Phase 11 — Manual / Runtime Evidence

Status: `runtime_pending`（VISUAL_ON_EXECUTION）

本タスクの証跡主ソースは **認証付き staging Playwright run**（`staging-visual-authenticated` project）である。本 wave では spec 実装までを完了し、staging 実行は行っていないため、このファイルは意図的に PASS ではなく runtime pending の ledger とする。

## 1. 証跡の主ソース

| 種別 | 内容 |
| --- | --- |
| 証跡方式 | Playwright `toHaveScreenshot` による visual baseline 取得（認証付き staging 実機） |
| 対象画面 | 認証付き staging `/admin/members` の BulkActionBar tag picker |
| 取得モード | read-only（member 選択 → picker 表示 → 付与/解除トグルのみ。mutation 厳禁） |
| storageState | admin role（`mint-staging-storage-state.ts` が mint した `.auth/admin.storageState.json`） |
| project | `staging-visual-authenticated`（既存。config 編集不要） |

## 2. runtime pending の理由（user-gated）

以下が揃わないと baseline を取得できないため、すべて本 wave で user 承認後に実施する:

- 認証付き staging のデプロイ（最新 dev の機能本体が staging に反映済みであること）
- admin secrets（`mint-staging-storage-state.ts` が storageState を mint するための認証情報）
- baseline 初回生成（`--update-snapshots` を伴う初回 run は人手承認が必要）
- 生成 baseline の commit / push

implemented_local_runtime_pending 段階では staging runtime capture が未実行であり、本ファイルは未取得状態を明示する。

## 3. 取得予定の canonical screenshot

| canonical 名（`toHaveScreenshot` arg） | 状態 | 内容 |
| --- | --- | --- |
| `bulk-tag-picker-assign-mode.png` | pending | member 複数選択 + tag picker（付与モード）表示 |
| `bulk-tag-picker-unassign-mode.png` | pending | 付与/解除トグルを解除へ切替えた picker 表示 |

baseline 物理ファイルは Playwright 慣習に従い `{testFileName}-snapshots/` 配下に生成し、evidence copy を `outputs/phase-11/screenshots/<canonical basename>-authenticated-staging.png` として workflow root に残す。

| evidence copy 先（workflow root 相対） | 状態 |
| --- | --- |
| `outputs/phase-11/screenshots/bulk-tag-picker-assign-mode-authenticated-staging.png` | pending |
| `outputs/phase-11/screenshots/bulk-tag-picker-unassign-mode-authenticated-staging.png` | pending |

## 4. capture command（user-gated）

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-11/evidence \
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test --project=staging-visual-authenticated \
  admin-members-bulk-tag-authenticated --update-snapshots
```

初回 `--update-snapshots` で baseline を生成し、2 回目以降は `--update-snapshots` を外して回帰検証する。`PLAYWRIGHT_EVIDENCE_DIR` は必ず本 workflow の `outputs/phase-11/evidence` に固定し、generic staging visual 既定の UT-DSF / issue-901 evidence path を汚さない。

## 5. 併走する回帰検証

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| 型チェック | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| 親 component 回帰 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | PASS（`BulkActionBar.spec.tsx` 10 tests PASS） |
| Playwright 登録確認 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-members-bulk-tag-authenticated --list` | PASS（新 spec 1 test + setup/teardown 3 tests を検出） |

runtime screenshot 取得は user-gated のため未実行。local verification は本 wave で PASS。
