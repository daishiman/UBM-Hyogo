# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 3 |
| Mode | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 6（異常系検証） |
| 次 Phase | 8（DRY 化） |
| 状態 | spec_created |

## 目的

Phase 1 で確定した AC-1〜AC-6 を、Phase 4 の verify ケースおよび Phase 5 の実装箇所と 1 対 1 でトレースする。すべての AC が「検証手段」と「実装箇所」を持つ状態を確定する。

## AC × Phase 4 検証 × Phase 5 実装 トレーサビリティ表

| AC | 内容 | Phase 4 検証ケース | Phase 5 実装箇所 |
| --- | --- | --- | --- |
| AC-1 | `schema_aliases` DDL がローカル D1 に applied | sanity S1（`d1 migrations apply --local` 後 list で applied 確認） / DDL の存在を起動時に前提化する E2E seed | Step 1 マイグレーション追加 + Step 2 ローカル apply |
| AC-2 | staging migration plan に反映 | runbook 上の staging apply 手順記載確認（Phase 11 manual evidence で再確認） | Step 1 マイグレーションファイル + Phase 12 runbook 記述 |
| AC-3 | `schemaAliasesRepository` 契約テスト存在 / green | unit `schemaAliases.contract.test.ts`（lookup / insert / update / unique violation / findByQuestionId） | Step 3 `apps/api/src/repositories/schemaAliases.ts` + 対応テスト |
| AC-4 | 07b が `schema_questions` を直接 UPDATE しない | contract: 07b handler 実行後の `schema_questions` row 不変検証 + static check `lint:no-direct-stablekey-update` で grep 0 件 | Step 6 handler 配線変更 + Step 8 grep pnpm script |
| AC-5 | 03a 次回 sync で unresolved 件数が事前比 1 件以上減少 | E2E `alias-resolution.e2e.test.ts` のステップ 1〜4（unresolved 件数 N → N-1） | Step 5 `resolveStableKey` + Step 7 03a 配線差替え |
| AC-6 | 移行期間中 `schema_questions.stable_key` fallback を維持 | contract F1〜F4（aliases miss → questions hit / 両方 hit → aliases 優先 / 両方 miss → null）+ Phase 6 F-MIGRATION-CONFLICT | Step 4 `findStableKeyById` 追加 + Step 5 lookup 順序実装 |

## 異常系 AC 補完

Phase 6 で扱う異常系も AC へ写像する。直接の AC は無いが、AC-4 / AC-5 の構造的支柱となる。

| 失敗ケース | 対応 AC | 検証 | 実装 |
| --- | --- | --- | --- |
| F-401 / F-403 | AC-4 構造境界 | authorization テスト | 既存 admin middleware 経路 |
| F-409（UNIQUE violation） | AC-3 / AC-4 | unit `insert` 重複ケース | DDL `UNIQUE(alias_question_id)` + repository ConflictError 正規化 |
| F-422（stableKey 不正） | AC-4 整合性 | contract validation | handler の allow-list バリデーション |
| F-5xx / F-PARTIAL | AC-5 sync 健全性 | E2E retry 経路 | `sync_jobs.status='failed'` 遷移 |
| F-MIGRATION-CONFLICT | AC-6 | F2 / 警告ログ | `resolveStableKey` aliases 優先実装 |

## 不変条件マトリクス

| 不変条件 | 関連 AC | 担保 Phase |
| --- | --- | --- |
| #1（schema 固定禁止） | AC-4 / AC-6 | Phase 5 Step 6 / 8、Phase 6 F-422 |
| #5（D1 直接アクセスは apps/api 限定） | AC-1〜AC-6 全体 | Phase 5 全 Step が `apps/api/` 配下 |
| #14（schema 変更は admin 集約） | AC-4 | Phase 5 Step 6 / Phase 6 F-401 / F-403 |

## トレース欠落チェック

| AC | Phase 4 ケース有 | Phase 5 実装箇所有 | 不変条件紐付 |
| --- | --- | --- | --- |
| AC-1 | YES | YES | #5 |
| AC-2 | YES | YES | #5 |
| AC-3 | YES | YES | #5 |
| AC-4 | YES | YES | #1 / #14 |
| AC-5 | YES | YES | #5 |
| AC-6 | YES | YES | #1 |

欠落: なし。

## 実行タスク

- [ ] 本 Phase の目的に対応する仕様判断を本文に固定する
- [ ] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [ ] 次 Phase が参照する入力と出力を明記する

## 成果物

- `outputs/phase-07/main.md`
- root `artifacts.json` と `outputs/artifacts.json` の parity

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] AC-1〜AC-6 すべてが「Phase 4 検証ケース」「Phase 5 実装箇所」を 1 対以上もつ
- [ ] 異常系の AC 補完が 5 ケース以上記載
- [ ] 不変条件 #1 / #5 / #14 すべての担保 Phase が示されている
- [ ] トレース欠落チェック表で全 AC が YES
- [ ] artifacts.json の phase 7 が `spec_created`

## 参照資料

- Phase 1（AC 定義） / Phase 4（verify suite） / Phase 5（runbook） / Phase 6（failure cases）
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`

## 次 Phase への引き渡し

- 引き継ぎ事項: 完全トレース表 / 異常系補完表 / 不変条件マトリクス
- ブロック条件: AC のいずれかが Phase 4 / Phase 5 のセルが空
- open question: なし（Phase 8 DRY 化に進める）
