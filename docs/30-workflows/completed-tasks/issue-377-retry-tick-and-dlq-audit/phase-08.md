# Phase 8: エラーハンドリング / リトライ分類

## 分類ポリシー

| 分類 | 例 | 挙動 |
| --- | --- | --- |
| retryable | D1 transient（`D1_ERROR` で再試行可能なもの）/ network timeout / 上流 API 5xx | `incrementRetry` 経由・指数バックオフ。max 超で DLQ + audit |
| non-retryable | `NonRetryableError`（明示 throw）/ schema validation / 既知の business invariants 違反 | `moveToDlq` で即時 DLQ + audit |
| unknown | 上記いずれにも該当しない `Error` | デフォルト retryable として扱う（**fail-safe: 振り分け不能を即捨てない**） |

## 実装上の注意

- `processRow` の default 実装は noop（拡張点）。実際の row 処理は本タスクスコープ外。retry / DLQ ロジックを単独でテスト可能にする。
- `incrementRetry` / `moveToDlq` 自体が transient で失敗した場合は `runTagQueueRetryTick` の上位に throw させ、`scheduled` handler の `.catch(() => {})` で sink して次回 tick に委ねる（at-least-once）。
- DLQ 移送と audit INSERT は同じ D1 batch にまとめる。audit INSERT 失敗だけを後から発見できない「DLQ だが監査なし」状態を避ける。

## NonRetryableError の利用契約

```ts
// processRow 実装側（将来拡張）が validation 違反時に明示 throw する
throw new NonRetryableError("invalid suggested_tags_json");
```

## 完了条件

- [ ] 分類表 / 実装注意事項 / NonRetryableError 利用契約が `outputs/phase-08/main.md` に記録される。

## 出力

- outputs/phase-08/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

retry / DLQ / audit のエラー境界を固定する。

## 実行タスク

- retryable / non-retryable / audit batch の挙動を実装する。

## 参照資料

- `apps/api/src/workflows/tagQueueRetryTick.ts`

## 成果物/実行手順

- `outputs/phase-08/main.md`

## 統合テスト連携

- DLQ + audit assertion
