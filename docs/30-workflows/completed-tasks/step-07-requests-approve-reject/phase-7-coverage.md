# Phase 7: Coverage 確認

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-6-test-additions
**次 Phase**: phase-8-refactor

## 目的

3 component（RequestQueuePanel / RequestQueueDetail / RequestConfirmDialog）の line / branch coverage ≥ 80% を確認する。

## 計測対象

| component | path |
|---|---|
| RequestQueuePanel | `apps/web/src/components/admin/RequestQueuePanel.tsx` |
| RequestQueueDetail | `apps/web/src/components/admin/RequestQueueDetail.tsx` |
| RequestConfirmDialog | `apps/web/src/components/admin/RequestConfirmDialog.tsx` |

## 目標値

| 指標 | 閾値 |
|---|---|
| line coverage | ≥ 80% |
| branch coverage | ≥ 80% |
| function coverage | ≥ 90% |
| statements coverage | ≥ 80% |

## 計測コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test --run --coverage \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx
```

## 重点 branch（必ず通すケース）

| branch | 関連 TC |
|---|---|
| 200 success path | TC-P-05 |
| 409 already_resolved | TC-P-06 |
| 404 note not found / member_status_not_found | TC-P-07 |
| 400 unsupported note type / 422 invalid desiredState | TC-P-08 |
| reject note 空 validation | TC-C-05 |
| reject note 入力 submit | TC-C-06 |
| approve submit (note 空) | TC-C-07 |
| isDestructive=true 表示 | TC-C-08 |
| busy disabled (Panel / Detail / Dialog) | TC-P-10 / TC-D-05 / TC-C-09 |
| note 500 文字超 validation | TC-C-10 |

## 未到達 branch の扱い

- 計測後 80% 未満となる branch が判明したら、phase-6 にフィードバックし test case を追補する（最大 1 往復）。
- 計測上は到達するが意味的に dead code の場合は当該分岐を削除する（phase-8 refactor へ）。

## 出力

- coverage HTML report（vitest 既定の `coverage/` 配下）
- phase-11 で evidence として `outputs/phase-11/evidence/test.log` に component coverage 行を抜粋保存
