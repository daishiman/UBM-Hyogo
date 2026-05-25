# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 名称 | 設計レビュー（AC マッピング / Phase 4 進行判定） |
| 依存 | phase-02.md + outputs/phase-02/{api-contract,d1-schema-migration,recompute-algorithm,ui-state-machine}.md |
| 成果物 | 本ファイル（phase-03.md） |
| 状態 | spec_created |

## 目的

Phase 2 で確定した設計（migration / API contract / reverse-backfill アルゴリズム / UI 状態機械）が AC-1〜AC-13 / RAC-1〜RAC-3 を漏れなく担保し、責務境界・状態所有権・idempotency に矛盾がないことをレビューし、Phase 4（テスト作成 TDD Red）へ進めるかを判定する。

## AC → 設計成果物 トレーサビリティ

| AC | 要求 | 担保する設計成果物 | レビュー判定 |
| --- | --- | --- | --- |
| AC-1 | reverse-backfill 実行 | recompute-algorithm.md `reverseBackfillResponseFields` + api-contract.md POST endpoint | ✅ stableKey→`__extra__:{qid}` の UPDATE が固定済み |
| AC-2 | idempotency（二重変動なし） | d1-schema-migration.md `(alias_id, stable_key, trigger_key)` UNIQUE + recompute-algorithm.md 二重防御 | ✅ job レベル + SQL レベルの二重防御を明記 |
| AC-3 | audit_log 記録 | recompute-algorithm.md audit insert（`schema_alias.recompute`）+ api-contract.md `recomputeAuditId` | ✅ after_json 項目固定 |
| AC-4 | GET status | api-contract.md GET endpoint + `RecomputeStatusResult` | ✅ 不在時 null 返却まで固定 |
| AC-5 | admin 明示操作のみ | ui-state-machine.md `handleRecompute`（ボタン押下起点）+ recompute-algorithm.md は rollback workflow を呼ばない | ✅ 自動連動なしを設計で保証 |
| AC-6 | warning 置換 + submitting disable / running continue | ui-state-machine.md DOM 構造（`recompute-action`/`recompute-status`）+ submitting disable + server `running` 継続操作 | ✅ 248-250 置換対象を明示 |
| AC-7 | migration UNIQUE 制約 | d1-schema-migration.md DDL + UNIQUE INDEX | ✅ PRAGMA 検証手順記載 |
| AC-8 | CPU budget exhausted 継続 | recompute-algorithm.md exhausted→running + cursor 保存 | ✅ 再呼び出し継続フロー固定 |
| AC-9 | useAdminMutation 経由 | ui-state-machine.md mutation 配線 | ✅ legacy 不参照を明記 |
| AC-10 | OKLch token のみ | ui-state-machine.md status バッジ token 表 | ✅ HEX 禁止を明記 |
| AC-11 | `*.spec.{ts,tsx}` 命名 | phase-01.md 命名規則表 + phase-04.md テストファイル名 | ✅ spec suffix 固定 |
| AC-12 | D1 直接アクセス禁止 | api-contract.md web helper は fetch のみ | ✅ topology で境界固定 |
| AC-13 | spec 2 本追記 | phase-12 system-spec-update-summary で 11-admin-management / 01-api-schema 更新 | ✅ Phase 12 で担保 |
| RAC-1 | migration apply evidence | phase-11 migration-apply.md | ✅ user-gated runtime |
| RAC-2 | resolve→rollback→recompute runtime | phase-11 recompute-runtime.md | ✅ user-gated runtime |
| RAC-3 | visual baseline | phase-11 visual-baseline.md | ✅ task-18 visual-full 整合 |

→ **全 AC が設計成果物に追跡可能**。未担保 AC なし。

## 責務境界レビュー（状態所有権の混在チェック）

| 層 | 責務 | 状態所有権 | 混在の有無 |
| --- | --- | --- | --- |
| SchemaDiffPanel（UI） | ボタン表示・status バッジ表示 | local UI status（API 応答から導出） | ✅ 真実を持たない（D1 が真実） |
| lib/admin/api.ts | fetch + error 解釈 | なし（stateless） | ✅ |
| routes/admin/schema.ts | 認証 / param / body parse / workflow 呼び出し | なし | ✅ |
| workflows/schemaAliasRecompute.ts | idempotency 判定 / reverse-backfill / audit | job 遷移の調停 | ✅ |
| repository/schemaAliasRecomputeJobs.ts | SQL のみ | なし | ✅ |
| D1 schema_alias_recompute_jobs | job 真実 | ✅ 唯一の真実源 | ✅ |

→ Facade（UI）/ Service（endpoint）/ Engine（workflow）/ Store（repository + D1）で状態所有権が分離。**混在なし**。

## 因果ループの閉じ確認

- バランスループ「rollback → 汚染 → recompute → 解消」が AC-1/AC-4/AC-6 で可視化＋実行可能。
- 強化ループ（負）「二重 recompute → 二重変動」を AC-2 の UNIQUE + SQL 冪等で遮断。
- → 設計上、制御不能なループは残らない。

## 設計上の決定事項（Phase 4 以降への確定指示）

1. **reverse-backfill は新規対称関数**（backfill 流用ではない）。`BACKFILL_BATCH_SIZE` / `BACKFILL_CPU_BUDGET_MS` は `schemaAliasAssign.ts` から import 再利用。未 export なら Phase 5 で export 化（drift 防止）。
2. **audit は rollback と対称に db.batch（job update + audit insert）でまとめる**ことを推奨。inline INSERT でも可。Phase 5 で最終決定。
3. **recompute は soft-deleted alias のみ対象**。`deleted_at IS NULL` は `409 not_rolled_back`。
4. **triggerKey 既定 = 元 rollback audit_id**（不在時 `alias_id:version`）。client からは受け取らず server-side に導出する。
5. **GET status の job 不在時は 200 + null**（404 ではない）。

## トレードオフ確認（4 条件）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | ✅ | 集計汚染（rollback 後の stable_key 残存）を admin 統制下で解消 |
| 実現性 | ✅ | backfill の対称実装で 1 サイクル完了可能。新規 primitive 不要 |
| 整合性 | ✅ | job UNIQUE + soft-deleted alias 取得 + path-namespace 分離で閉じる |
| 運用性 | ✅ | status バッジ + audit + GET status で監査・再開運用が成立 |

## レビュー判定

| 項目 | 判定 |
| --- | --- |
| 全 AC が設計成果物に追跡可能 | ✅ PASS |
| 責務境界・状態所有権に混在なし | ✅ PASS |
| idempotency 戦略が二重防御で固定 | ✅ PASS |
| CONST_007 スコープ（bulk/通知/Queue を分離） | ✅ PASS |
| **Phase 4 進行可否** | **✅ 進行可（GO）** |

## 完了条件 (DoD)

- [ ] AC-1〜AC-13 / RAC-1〜RAC-3 が設計成果物にマッピングされ未担保ゼロ
- [ ] 責務境界・状態所有権の混在がないことをレビュー済み
- [ ] Phase 4 進行判定（GO/NO-GO）が記録されている
- [ ] Phase 5 以降への確定指示（5 項目）が固定されている
