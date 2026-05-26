# Phase 6: テスト拡充

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 名称 | テスト拡充（fail path / 回帰 guard / エッジケースの追加） |
| 依存 | phase-05.md（実装 Green） |
| 成果物 | 本ファイル（phase-06.md） |
| 状態 | spec_created |

## 目的

phase-04 の正常系・主要分岐（T-01〜T-15U）で Green になった実装に対し、エッジケース・fail path・既存機能の回帰 guard を追加し、idempotency / soft-delete 除外 / CPU budget 継続 / audit 重複なし / GET status 全 status の網羅性を上げる。Phase 7（カバレッジ確認）の前提となる test 厚みを作る。

## 追加テストケース（T-13 以降・API/workflow）

| ID | 対象ファイル | 検証内容 | 対応 AC / 不変条件 |
| --- | --- | --- | --- |
| T-13 | schemaAliasRecompute.spec.ts | reverse-backfill 0 件 no-op: `aliasQuestionId` から導出される `__extra__:{qid}` が `alias.stableKey` と一致するケース（`extraKey === stableKey`）で `reverseBackfillResponseFields` が `updated:0` / `status:"completed"` を返し `response_fields` 無変更 | AC-2（idempotent no-op） |
| T-14 | schemaAliasRecompute.spec.ts | 削除済み member の response 除外: `member_identities.current_response_id` が `deleted_members` に紐づく response は reverse-backfill 対象外。削除 member の `full_name` 行は `__extra__` へ移動せず残る | 不変条件6（backfill と同除外条件） |
| T-15 | schemaAliasRecompute.spec.ts | 大量件数の chunk 跨ぎ継続: seed を `BATCH_SIZE`（100）超（例 250 件）にし、`batchSize=100` 指定で複数 chunk を跨いで全件 `__extra__` へ整復、`updated` が seed 件数と一致 | AC-1 / AC-8 |
| T-16 | schemaAliasRecompute.spec.ts | exhausted→再開で完了: 1 回目 `cpuBudgetMs=0` で `exhausted`（job `running` / cursor 保存）→ 2 回目（通常 budget・同 triggerKey）で `createOrGetJob` が同 job を返し残件処理 → `completed`。最終 `__extra__` 件数 == seed 件数（二重変動なし） | AC-2 / AC-8 |
| T-17 | schemaAliasRecompute.spec.ts | batch_failed: `c.db.batch` 非対応 / UPDATE 例外を注入 → job が `failed`・`last_error` 記録、`SchemaAliasRecomputeFailure` kind=`batch_failed` throw | api-contract.md 500 |
| T-18 | schema.recompute.spec.ts | audit 重複記録なし: 同 alias へ 2 回 POST（idempotent）後、`audit_log` の `action='schema_alias.recompute' AND target_id=aliasId` 件数が冪等再実行で増えない（completed job 再返却時は audit を追加しない） | AC-3 / AC-2 |
| T-19 | schema.recompute.spec.ts | GET status の各 status: pending（job 直後）/ running（exhausted 後）/ completed / failed のそれぞれで `GET` が該当 `status` と `affectedCount` / `processedCount` / `lastError` を返す。failed では `lastError` 非 null | AC-4 |
| T-20 | schema.recompute.spec.ts | GET status null: recompute 未実行 alias へ `GET` → body `null`・200 | AC-4 |
| T-21 | schema.recompute.spec.ts | 400 bad_request: body parse 失敗（`reason` が 501 文字、または未知 key `triggerKey` を含む body）→ 400 `{ error: "bad_request" }`、`response_fields` 無変更。client 由来 triggerKey は受け取らない | api-contract.md 400 |
| T-22 | schema.recompute.spec.ts | 401 unauthenticated: 認証ヘッダなしで POST → 401（rollback spec と同じ admin middleware ガード） | 不変条件3（既存 auth 流用） |

## 追加 UI ケース（T-23U 以降）

| ID | 対象 | 検証内容 | 対応 AC |
| --- | --- | --- | --- |
| T-23U | SchemaDiffPanel.component.spec.tsx | completed 後の再押下 no-op: mock が `status:"completed"` を返した後、`recompute-trigger` ラベルが「再集計済み」になり、再押下しても mock が冪等（同一引数・client triggerKey なし）で呼ばれ DOM が二重変動しない | AC-2 / AC-6 |
| T-24U | SchemaDiffPanel.component.spec.tsx | `impact.recomputeRequired === false` のとき `recompute-action` を描画しない（再集計不要 alias に導線を出さない） | AC-5 / AC-6 |
| T-25U | SchemaDiffPanel.component.spec.tsx | legacy import なし回帰: コンポーネントが `@/lib/useAdminMutation`（legacy）を import せず `@/features/admin/hooks/useAdminMutation` のみを使う（mock 経路で確認 or import 静的検査） | AC-9 |

## web helper 追加ケース

| ID | 対象 | 検証内容 | 対応 AC |
| --- | --- | --- | --- |
| T-26 | api.spec.ts | `recomputeSchemaAlias`: 404 `not_found` を `RecomputeApiError`（status=404 / code=`not_found`）へ変換 | AC-12 |
| T-27 | api.spec.ts | `getSchemaAliasRecomputeStatus`: 200 + job body を `RecomputeStatusResult` として返す（path encode 確認）／ 5xx を `RecomputeApiError` へ変換 | AC-4 / AC-12 |

## 回帰 guard（既存機能を壊していないこと）

recompute 追加が既存 schema alias 経路へ副作用を与えないことを確認する。**新規 endpoint / workflow / migration の追加のみで既存ロジックは touch しない**設計（不変条件3）のため、回帰確認は既存 spec の **再実行 pass** で担保し、必要に応じ最小の cross-check を加える:

| 対象 | 確認方針 |
| --- | --- |
| rollback endpoint | 既存 `apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` が全件 pass（recompute 追加後も rollback の soft-delete / queue restore / audit / impact が不変）。recompute は rollback workflow を呼ばない（AC-5）ことを workflow spec 側で間接確認 |
| resolve / backfill（`backfillResponseFields`） | 既存 `apps/api/src/workflows/schemaAliasAssign.contract.spec.ts` / `schemaAliasBackfillBatch.contract.spec.ts` が全件 pass。`BACKFILL_BATCH_SIZE` / `BACKFILL_CPU_BUDGET_MS` を recompute が import 再利用しても export 値は不変（drift なし） |
| schemaAliases repository | 既存 `apps/api/src/repository/schemaAliases.repository.spec.ts` が pass（`getById` の `includeDeleted` オプションを recompute が利用しても挙動不変） |
| migration 全件 | `setupD1()` が `0020` 含む全 migration を apply しても既存 spec の seed / fixture が壊れない（`0020` は新規テーブル追加のみ・既存テーブル DDL 変更なし） |

> 回帰確認は targeted run（下記）で既存 4 spec を含め再実行する。fail があれば recompute 追加が原因の副作用であり、原因切り分けの上で recompute 側を修正する（既存ロジックは変更しない）。

## targeted run コマンド

```bash
# 拡充対象（新規 + 既存回帰）
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/workflows/schemaAliasRecompute.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/lib/admin/__tests__/api.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
# 回帰 guard（既存 spec 再実行）
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/workflows/schemaAliasAssign.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/repository/schemaAliases.repository.spec.ts
```

## 完了条件 (DoD)

- [ ] T-13〜T-22（API/workflow fail path / エッジ）が追加され Green
- [ ] T-23U〜T-25U（UI エッジ / legacy import 回帰）が追加され Green
- [ ] T-26〜T-27（web helper fail path）が追加され Green
- [ ] idempotency が「2 回実行後の `__extra__` 件数 == 1 回実行後」「audit 重複なし」で多面的に確認されている（AC-2）
- [ ] 削除済み member の response 除外（不変条件6）が検証されている
- [ ] chunk 跨ぎ + exhausted→再開で全件整復（AC-8）が検証されている
- [ ] GET status の pending/running/completed/failed/null が網羅されている（AC-4）
- [ ] 既存 rollback / resolve / backfill / repository spec が回帰なく pass
- [ ] 全 spec が `*.spec.{ts,tsx}` 命名（AC-11）
