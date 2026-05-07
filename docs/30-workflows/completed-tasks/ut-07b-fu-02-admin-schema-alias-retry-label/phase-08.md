# Phase 8: DRY 化 / 仕様間整合

`[実装区分: 実装仕様書]`

## 1. DRY 観点

| 項目 | 確認 | 対応 |
| --- | --- | --- |
| status code → feedback kind の分岐 | `onSubmit` 内に分岐が分散しないか | Phase 5 §3.3 で `if (predicate) ... if (!r.ok) ...` の薄い直列分岐に閉じ込め、helper 関数化は不要（4 分岐のため過剰抽象を避ける） |
| narrowing predicate 重複 | component / test で同じ predicate を再実装していないか | `isSchemaAliasRetryableContinuation` を `api.ts` から re-export し、component と test 双方で import |
| 文言定数 | label を複数箇所に書いていないか | `SchemaDiffPanel.tsx` 内の 1 箇所に集約。test では文字列の部分一致（`toContain`）で検証して文言ロックを避ける |
| status / role mapping | feedback kind → role 変換が散らばっていないか | render 内の三項演算 1 箇所のみ（`success` / `retryable` → `status`、それ以外 → `alert`） |

## 2. 仕様間整合

| 仕様 | 整合確認 | 対応 |
| --- | --- | --- |
| UT-07B 本体 API contract | 200/202/422/409 の status と body 構造が変更されていない | `apps/api/src/routes/admin/schema.ts` line 196-241 / `apps/api/src/workflows/schemaAliasAssign.ts` line 47-55 を変更しない |
| UT-07B-FU-01（queue/cron 分割） | enqueue 結果（`dedupeKey` / `enqueued`）の存在を破壊しない | 型 `SchemaAliasApplySuccessBody.backfill` が optional フィールドとして許容 |
| `mapBackfillToV2` の status 4 値 | `pending` / `running` / `exhausted` / `completed` を web 側でも一致 | `SchemaAliasBackfillStatus` で 4 値 union 固定 |
| 不変条件 #5 / #11 / #14 | 違反なし | Phase 9 で `rg "from .*api.*D1"` 等で確認 |

## 3. aiworkflow-requirements skill との整合

aiworkflow-requirements skill 配下の正本仕様（`.claude/skills/aiworkflow-requirements/references/`）について:

- `admin-schema-diff` 系の正本があれば、本タスク完了時に Phase 12 で「retryable continuation の表示要件を追記」する。
- 既存正本に該当章がない場合、Phase 12 の `update-system-specs` agent で追記要否を判定し、追記不要なら理由を記録する。

## 4. 完了条件

- [ ] DRY 観点 4 項目チェック済み
- [ ] 仕様間整合 4 項目チェック済み
- [ ] aiworkflow-requirements 同期方針が決定
