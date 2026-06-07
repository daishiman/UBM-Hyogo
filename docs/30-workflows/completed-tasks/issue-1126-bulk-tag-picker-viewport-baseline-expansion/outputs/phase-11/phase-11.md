# Phase 11: 手動テスト / visual evidence 計画

`[実装区分: 実装仕様書]` / `implementation_mode: edit` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Issue #1126「bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide）」の手動テスト / visual evidence 計画フェーズ。
本タスクは VISUAL_ON_EXECUTION だが workflow_state=`implemented_local_runtime_pending` のため、**実 capture はまだ取得しない**（capture は user-gated）。本ファイルは取得予定の evidence 計画 ledger であり、実在しない PNG を `present` とは記さない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| issue | #1126（CLOSED 維持 / `Refs #1126`） |
| phase | 11（手動テスト / visual evidence 計画） |
| workflow_state | `implemented_local_runtime_pending`（実 capture 未取得 / runtime pending） |
| visualEvidence | VISUAL_ON_EXECUTION |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` |

## 1. 証跡の主ソース

| 種別 | 内容 |
| --- | --- |
| 証跡方式 | Playwright `toHaveScreenshot` による visual baseline 取得（認証付き staging 実機） |
| 対象画面 | 認証付き staging `/admin/members` の BulkActionBar tag picker（mobile / tablet / wide / desktop） |
| 取得モード | read-only（member 選択 → picker 表示 → 付与/解除トグルのみ。mutation 厳禁） |
| project | `staging-visual-authenticated`（既存。config 編集不要） |
| 現状 | `implemented_local_runtime_pending` のため実 capture は未取得。**設計確定（B案）＋ 既存 desktop baseline 実績（issue-1077 で取得済）が一次根拠**。新規 6 枚は本実行サイクルで user 承認後に取得予定 |

> implemented_local_runtime_pending 段階では staging runtime capture を実行しない。本ファイルは未取得状態を明示する ledger であり、意図的に PASS ではなく runtime pending とする。

## 2. runtime pending の理由（user-gated）

以下が揃わないと baseline を取得できないため、すべて本実行サイクルで user 承認後に実施する:

- 認証付き staging のデプロイ（最新 dev の機能本体が staging に反映済みであること）
- admin secrets（`mint-staging-storage-state.ts` が storageState を mint するための認証情報）
- storageState mint（`.auth/admin.storageState.json` の生成）
- 認証付き capture（`--project=staging-visual-authenticated` の実機 run）
- baseline 初回生成（`--update-snapshots` を伴う初回 run は人手承認が必要）
- 生成 baseline の commit / push

## 3. 取得予定の canonical screenshot

行 = baseline、列 = viewport / mode / status。status は全て `pending`（runtime visual pending）とする。

| canonical 名（`toHaveScreenshot` arg） | viewport | mode | status |
| --- | --- | --- | --- |
| `bulk-tag-picker-assign-mode-mobile.png` | mobile（390×844） | assign | pending |
| `bulk-tag-picker-unassign-mode-mobile.png` | mobile（390×844） | unassign | pending |
| `bulk-tag-picker-assign-mode-tablet.png` | tablet（768×1024） | assign | pending |
| `bulk-tag-picker-unassign-mode-tablet.png` | tablet（768×1024） | unassign | pending |
| `bulk-tag-picker-assign-mode-wide.png` | wide（1920×1080） | assign | pending |
| `bulk-tag-picker-unassign-mode-wide.png` | wide（1920×1080） | unassign | pending |

既存 desktop baseline（本タスクで既存経路を温存）:

| canonical 名 | viewport | mode | 注記 |
| --- | --- | --- | --- |
| `bulk-tag-picker-assign-mode.png` | desktop（1280×800） | assign | issue-1077 で取得済・本タスク不変 |
| `bulk-tag-picker-unassign-mode.png` | desktop（1280×800） | unassign | issue-1077 で取得済・本タスク不変 |

> 新規 6 枚はいずれも status=`pending`（implemented_local_runtime_pending・未取得）。desktop 2 枚は issue-1077 で取得済のため本タスクでは取得せず、不変として温存する。
> status 列で使用する値は `present` / `pending` / `n/a` の 3 値のうち、本タスクでは runtime visual 未取得を示す `pending` を使う。

## 4. capture command（user-gated）

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/outputs/phase-11/evidence \
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test --project=staging-visual-authenticated \
  admin-members-bulk-tag-authenticated --update-snapshots
```

手順:

1. admin secrets / storageState mint（`mint-staging-storage-state.ts` が `.auth/admin.storageState.json` を mint）。
2. 初回 `--update-snapshots` で新規 6 baseline を生成（既存 desktop 2 baseline は不変・上書きしない）。
3. 2 回目以降は `--update-snapshots` を外して回帰検証（8 baseline の比較 PASS を確認）。
4. `PLAYWRIGHT_EVIDENCE_DIR` は必ず本 workflow の `outputs/phase-11/evidence` に固定し、generic staging visual 既定の evidence path を汚さない。

> capture / `--update-snapshots` / commit / push はすべて user-gated。implemented_local_runtime_pending 段階では実行しない。

## 5. 併走する回帰検証

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| 型チェック | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| 親 component 回帰 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | PASS（BulkActionBar.spec.tsx が緑） |

> runtime screenshot 取得は user-gated のため未実行。ローカル併走検証（typecheck / lint / focused component test / Phase 12 compliance / index rebuild）は本実行サイクルで spec / fixture 編集後に PASS を確認済み。
