# システム仕様更新判定（Task 2）

> 結論: Step 1 task ledger / artifact inventory / discovery indexes は同一wave同期済み。Step 2のグローバル公開契約変更は **N/A**。

## Step 1-A: 完了タスク記録

- **taskId**: `TASK-SENTRY-EXTENSION-NOISE-FILTER-001`
- **workflow**: `sentry-extension-noise-filter-spec`
- **種別**: implementation / NON_VISUAL
- **成果**: クライアント側Sentry拡張ノイズフィルタを実装し、`Sentry.init` に `beforeSend` / `ignoreErrors` / `denyUrls` を配線。
- **記録先**:
  - `docs/30-workflows/sentry-extension-noise-filter-spec/`
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
  - `.claude/skills/aiworkflow-requirements/references/workflow-sentry-extension-noise-filter-spec-artifact-inventory.md`
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/changelog/20260607-sentry-extension-noise-filter-spec.md`

## Step 1-B: 実装状況テーブル

| 項目 | 値 |
|------|----|
| workflow_state | `implemented_local_evidence_captured` |
| implementation_status | `implementation_complete_pending_pr` |
| コード実装 | 完了 |
| 新規ファイル | `apps/web/src/lib/sentry/extension-noise-filter.ts` / `apps/web/src/lib/sentry/extension-noise-filter.spec.ts` |
| 編集ファイル | `apps/web/src/instrumentation-client.ts` / `apps/web/src/__tests__/instrumentation-client.runtime.spec.ts` / `apps/web/src/lib/sentry/index.ts` |
| 実行済み verify | focused vitest 14 PASS / web typecheck PASS / web lint PASS |

## Step 1-C: 関連タスク

- 既存 `apps/web/src/lib/sentry/capture.ts` は手動capture / fail-soft。今回の変更は自動eventの送信前フィルタで、二重フィルタは行わない。
- `@sentry/nextjs` client SDKのみを `instrumentation-client.ts` で使用。server `@sentry/cloudflare` 境界は不変。
- 到達不能ノイズ（`service-worker-loader.js` / `runtime.lastError` / 他拡張のSentry警告）はコード対策対象外。

## Step 2: 新規インターフェース追加の有無

### 判定: グローバルsystem spec変更はN/A

新規exportは `apps/web` 内部のobservability utilであり、API endpoint / D1 schema / Google Form schema / 認証境界 / cross-package公開契約を変更しない。

| 判定軸 | 本タスク | system spec変更 |
|--------|----------|-----------------|
| API endpoint surface | 変更なし | N/A |
| D1 schema / migration | 変更なし | N/A |
| Google Form schema | 変更なし | N/A |
| 認証境界 / consent key | 変更なし | N/A |
| cross-package公開契約 | なし | N/A |
| apps/webローカルutil | 追加あり | workflow / aiworkflow ledgerに記録 |

## 結論

公開契約のsystem spec更新は不要。ただしtask ledger / artifact inventory / discovery indexesは同一waveで同期済み。
