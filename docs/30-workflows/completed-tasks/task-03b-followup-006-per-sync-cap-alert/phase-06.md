[実装区分: 実装仕様書]

# Phase 6: 単体テスト計画 — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
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
- phase-05.md

## 成果物

- phase-06.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## 1. cap-alert.test.ts（新規）

| ID | ケース | 期待結果 |
| --- | --- | --- |
| T-1 | sync_jobs に 0 行 | `thresholdReached = false`, `consecutiveHits = 0` |
| T-2 | 直近 3 行のうち 1 行のみ writeCapHit=true | `thresholdReached = false`, `consecutiveHits = 0` (連続でない) |
| T-3 | 直近 3 行すべて writeCapHit=true | `thresholdReached = true`, `consecutiveHits = 3` |
| T-4 | 直近 3 行すべて true、4 行目 false | `thresholdReached = true`, `previousWindowReached = false`, `shouldEmit = true` |
| T-5 | skipped=true 行が直近 window に入る | `thresholdReached = false`（streak reset） |
| T-5b | failed 行が直近 window に入る | `thresholdReached = false`（streak reset） |
| T-6 | SYNC_ALERTS binding 未定義時の `emitConsecutiveCapHitEvent` | `console.warn` 1 回、例外 throw されない |
| T-7 | Analytics Engine emit で例外発生 | `console.warn` で握り潰され例外伝播しない |
| T-8 | 直近 4 行すべて true | `thresholdReached = true`, `previousWindowReached = true`, `shouldEmit = false`（重複 emit 抑制） |
| T-9 | 旧行で `writeCapHit` absent / NULL が混在 | absent / NULL は false 解釈 |
| T-10 | `started_at` が同一の行が混在 | `ORDER BY started_at DESC, job_id DESC` で決定的 |

### 実装方針

- `__fixtures__/d1-fake.ts` をそのまま再利用
- Analytics Engine binding は手動 stub: `{ writeDataPoint: vi.fn() }`
- 例外ケースは `writeDataPoint: vi.fn(() => { throw new Error("AE down") })` で再現

## 2. sync-forms-responses.test.ts（更新）

| ID | ケース | 期待結果 |
| --- | --- | --- |
| S-1 | cap 未到達で完了 | `metrics_json.writeCapHit === false`、emit 0 回 |
| S-2 | cap 到達で完了（直近 3 件中 1 件のみ） | `writeCapHit === true`、emit 0 回（threshold 未達） |
| S-3 | 直近 3 件すべて cap 到達、直前 window は未達 | `writeCapHit === true`、emit 1 回（blobs=["sync_write_cap_consecutive_hit", "response_sync"]、doubles=[3, 3]） |
| S-4 | skipped (lock 取得失敗) | `writeCapHit === false`、emit 0 回 |
| S-5 | failed path | detector 呼ばれない、emit 0 回 |
| S-6 | 連続 cap hit が 4 回目以降も継続 | `writeCapHit === true`、emit 0 回（再通知ループなし） |

## 3. types テスト更新

- `sync-forms-responses.types.test.ts` の `metrics_json` 期待値に `writeCapHit?: boolean` を追加

## 4. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test cap-alert
mise exec -- pnpm --filter @ubm-hyogo/api test sync-forms-responses
mise exec -- pnpm --filter @ubm-hyogo/api test:cov
```

## 5. カバレッジ目標

- `cap-alert.ts`: line / branch ≥ 95%
- `sync-forms-responses.ts` の追加部分: 全分岐網羅

## 完了条件

- T-1〜T-10、S-1〜S-6 すべて green
- 既存テストが regression なく PASS
