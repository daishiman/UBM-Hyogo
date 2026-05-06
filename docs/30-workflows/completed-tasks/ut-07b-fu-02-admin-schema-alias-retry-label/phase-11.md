# Phase 11: 手動検証

`[実装区分: 実装仕様書 / visualEvidence: VISUAL_ON_EXECUTION]`

本 Phase は実装済み web UI の component evidence と、runtime / visual evidence の境界を定義する。focused Vitest evidence は取得済みだが、manual screenshot はローカル admin fixture / browser capture が必要なため `PENDING_RUNTIME_EVIDENCE` として分離する。

## 1. 検証手順

### 1.1 component test 出力（自動）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.test.ts \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  --reporter=default --reporter=junit \
  --outputFile.junit=/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-182313-wt-6/docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/outputs/phase-11/test-junit.xml
```

期待: API-01〜API-05、UI-01〜UI-05 の合計 10 件以上が PASS。`outputs/phase-11/test-junit.xml` を evidence として保存。

### 1.2 manual screenshot（admin UI）

ローカル dev で fetch を 202 retryable に差し替えて screenshot を取る:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

ブラウザ DevTools の network override で POST `/api/admin/schema/aliases` の response を以下に書き換える:

```json
{
  "ok": true,
  "mode": "apply",
  "confirmed": true,
  "backfill": {
    "status": "exhausted",
    "retryable": true,
    "code": "backfill_cpu_budget_exhausted",
    "remaining": -1,
    "lastProcessedAt": "2026-05-06T10:00:00Z"
  }
}
```

status は 202 を返す。期待される画面:

| screenshot | 状態 | 保存先 |
| --- | --- | --- |
| `01-success.png` | 200 success（label「alias を割当てました」） | `outputs/phase-11/01-success.png` |
| `02-retryable.png` | 202 retryable（「Back-fill 再試行可能」+ 「続きから処理」） | `outputs/phase-11/02-retryable.png` |
| `03-validation-error.png` | 422 validation error | `outputs/phase-11/03-validation-error.png` |
| `04-conflict-error.png` | 409 conflict | `outputs/phase-11/04-conflict-error.png` |

### 1.3 検証チェック

| 項目 | 手段 | 期待 |
| --- | --- | --- |
| label 文言 | screenshot 目視 | `Back-fill 再試行可能（続きから処理できます）` |
| role / aria | DevTools accessibility tree | retryable は `role=status`、error は `role=alert` |
| form open 維持 | 操作 | retryable 後も active 選択と stableKey 入力が残る |
| 再送信可能 | 操作 | retryable 後に「割当」を再押下できる（disabled でない） |

## 2. evidence 保存

`outputs/phase-11/` 配下に `test-junit.xml` と `*.png` を保存する。screenshot が取得できない環境（CI / 非 GUI）では `outputs/phase-11/manual-evidence-deferred.md` に理由と再取得タイミングを記載し、総合判定は `PENDING_RUNTIME_EVIDENCE` に留める。

## 3. 完了条件

- [x] component test 30 件 PASS の evidence: `outputs/phase-11/test-junit.xml`
- [x] 4 状態 screenshot は `outputs/phase-11/manual-evidence-deferred.md` に `PENDING_RUNTIME_EVIDENCE` と再取得条件を記録
- [ ] role / form open 維持 / 再送信可能の 3 観点の browser runtime 確認
