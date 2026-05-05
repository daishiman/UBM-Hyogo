[実装区分: 実装仕様書]

# Phase 7: 統合 / 契約検証 — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-06.md

## 成果物

- phase-07.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## 1. 契約検証対象

| 契約 | 検証内容 | 検証手段 |
| --- | --- | --- |
| `metrics_json` schema | `writeCapHit` が optional / boolean / 後方互換 | zod schema unit test |
| sync_jobs ledger | cap 到達後の行に `writeCapHit=true` JSON 値が永続化 | `__fixtures__/d1-fake.ts` で SQL 経由検証 |
| Analytics Engine binding | `SYNC_ALERTS.writeDataPoint` が期待 shape で呼ばれる | spy mock の引数検証 |
| 既存 cursor-store 契約 | `writeCapHit` 追加によって cursor 復元が壊れない | cursor-store unit test を再実行 |

## 2. 統合テスト追加

- `apps/api/src/jobs/sync-forms-responses.test.ts` のエンドツーエンドケースに以下を追加
  - 連続 3 回のレスポンス過多シナリオ → 3 回目末尾で 1 emit
  - cap hit 後 1 回 cap 未到達 → emit されない（threshold reset 確認）

## 3. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

## 4. ガード

- DTO / metrics_json の PII guard が drift していないこと（既存 `_shared/sync-jobs-schema.ts` PII テストの再実行）
- 不変条件 #5（D1 直接アクセスは apps/api 限定）の維持

## 完了条件

- 全契約検証が PASS
- 統合シナリオ 2 ケースが green
