# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 名称 | カバレッジ確認（新規 surface の coverage 可視化・未カバー許容範囲の確定） |
| 依存 | phase-04.md（TDD Red）/ phase-05.md（実装）/ phase-06.md（テスト拡充） |
| 成果物 | 本ファイル（phase-07.md） |
| 状態 | spec_created |

## 目的

Phase 4〜6 で作成・拡充したテストが、recompute 実装の新規 surface（migration / workflow / repository / endpoint / web helper / UI）と、dependency edge（reverse-backfill ↔ job idempotency ↔ audit）を漏れなくカバーしていることを可視化する。runtime-only（migration apply / staging recompute）な検証は Phase 11 evidence に委譲することを明文化し、未カバー許容範囲を確定する。

## カバレッジ対象 → concern マッピング

| surface（inventory） | 主 concern | カバーする test file | 担保 AC |
| --- | --- | --- | --- |
| `apps/api/src/workflows/schemaAliasRecompute.ts` | reverse-backfill 件数 / idempotency / 衝突回避 / CPU budget exhausted 分岐 / failure kind | `apps/api/src/workflows/schemaAliasRecompute.spec.ts` | AC-1, AC-2, AC-8 |
| `apps/api/src/repository/schemaAliasRecomputeJobs.ts` | `createOrGetJob`（UNIQUE 検出）/ `updateJobStatus` / `getLatestJobByAlias`（不在時 null） | `schemaAliasRecompute.spec.ts`（workflow 経由）+ `schema.recompute.spec.ts`（endpoint 経由） | AC-2, AC-4 |
| `apps/api/src/routes/admin/schema.ts`（recompute 2 本） | endpoint happy / idempotent re-run / not-found(404) / not_rolled_back(409) / GET status / audit insertion | `apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts` | AC-1, AC-3, AC-4 |
| `apps/web/src/lib/admin/api.ts`（helper 2 本 + `RecomputeApiError`） | `recomputeSchemaAlias` / `getSchemaAliasRecomputeStatus` の fetch + error 解釈 | `apps/web/src/lib/admin/__tests__/api.spec.ts`（ケース追加） | AC-9, AC-12 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx`（recompute UI） | ボタン押下 → API 配線 / submitting disable / running continue / failed 表示 / status バッジ | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`（ケース追加） | AC-5, AC-6, AC-8, AC-9 |
| `apps/api/migrations/0020_schema_alias_recompute_jobs.sql` | テーブル / UNIQUE / index DDL | （runtime-only）Phase 11 `outputs/phase-11/migration-apply.md` の PRAGMA evidence へ委譲 | AC-7（RAC-1） |

## dependency edge の coverage 可視化

recompute は単独 surface の line coverage だけでなく、3 つの dependency edge を 1 つのシナリオで通すことで初めて「集計汚染の解消」を担保する。各 edge を貫くテストを明示する。

```
[reverse-backfill]  ──(1)──>  [job idempotency]  ──(2)──>  [audit]
   stableKey→__extra__         (alias_id,stable_key,           schema_alias.recompute
                                trigger_key) UNIQUE             after_json 記録
```

| edge | 内容 | 貫くテスト | 担保 AC |
| --- | --- | --- | --- |
| (1) reverse-backfill ↔ job idempotency | reverse-backfill を 2 回実行しても job UNIQUE + SQL レベル冪等で `response_fields` 件数が二重変動しない | `schemaAliasRecompute.spec.ts`「2 回実行後の件数 == 1 回実行後の件数」 | AC-2 |
| (2) job idempotency ↔ audit | 既存 completed job 検出時は reverse-backfill を skip しつつ、新規実行時のみ `schema_alias.recompute` audit を 1 行記録（二重 audit を作らない） | `schema.recompute.spec.ts`「初回 audit 1 行 / 再実行で audit 追加なし or no-op」 | AC-2, AC-3 |
| (1)+(3) reverse-backfill ↔ audit relation | recompute の `after_json.relatedRollbackAuditId` が元 rollback audit と紐づく | `schema.recompute.spec.ts`「resolve → rollback → recompute の audit chain」 | AC-3 |
| exhausted continuation | CPU budget exhausted → job `running` + cursor 残存 → 再呼び出しで `completed` | `schemaAliasRecompute.spec.ts`「exhausted → 再開で完了」 | AC-8 |

## カバレッジ取得コマンド

> 全件 `pnpm test` ではなく、Phase 1 で固定した targeted test ファイルに対して coverage を取得する（FB-UI-02-2 / メモリ制約対策）。package 名は `apps/api` = `@ubm-hyogo/api`、`apps/web` = `@ubm-hyogo/web`（`package.json` で確認済み）。

```bash
# API workflow / repository / endpoint（unit + d1 の 2 系統 coverage を merge する正規 script）
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
# → apps/api/coverage/ に unit + d1 merge 後の coverage-final.json が出力される

# 個別 surface のみ素早く確認する場合（coverage なし・targeted run）
mise exec -- pnpm --filter @ubm-hyogo/api test src/workflows/schemaAliasRecompute.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test src/routes/admin/__tests__/schema.recompute.spec.ts

# web helper / UI component
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
# 個別 targeted run
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/admin/__tests__/api.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
```

- `@ubm-hyogo/api` の coverage は `test:coverage:unit` + `test:coverage:d1` を実行後 `scripts/coverage-merge.mjs` で統合する（`package.json#scripts.test:coverage` の正規経路）。reverse-backfill の SQL 分岐は D1（miniflare）系統でカバーされるため、unit のみの coverage では D1 経路が欠落する点に注意する。
- `@ubm-hyogo/web` の coverage include は `apps/web/src/**/*.{ts,tsx}`。helper / UI component が対象に含まれる。

## カバレッジ判定基準

| surface | line/branch 目標 | 重点 branch |
| --- | --- | --- |
| `schemaAliasRecompute.ts` | 主要分岐網羅 | `not_found` / `not_rolled_back` / `batch_failed` / `exhausted` vs `completed` / idempotent no-op（`extraKey === stableKey`） |
| `schemaAliasRecomputeJobs.ts` | 主要分岐網羅 | `createOrGetJob` の「既存 completed return」/「running 継続」/「新規作成」3 分岐 |
| `routes/admin/schema.ts`（recompute） | endpoint 行網羅 | 404 / 409 / 200(completed) / 200(running) / GET null |
| `lib/admin/api.ts`（helper） | helper 行網羅 | 成功 / `RecomputeApiError`（status 別 message） |
| `SchemaDiffPanel.tsx`（recompute UI） | recompute 関連分岐網羅 | idle / submitting(disable) / completed / running / failed の status バッジ分岐 |

> coverage 数値の絶対閾値は repo の既存 coverage-guard ポリシーに従う。本タスクで新設する surface は新規行ゆえ、既存 baseline を下げないことを最低条件とする（`scripts/coverage-guard.sh` の `--changed` モードで検査）。

## 未カバー許容範囲（Phase 11 evidence へ委譲）

| 項目 | 理由 | 委譲先 |
| --- | --- | --- |
| migration `0020` の DDL 適用（テーブル/UNIQUE/index 生成） | runtime-only。D1 への `migrations apply` 実行結果でしか確認できない | RAC-1 / `outputs/phase-11/migration-apply.md`（`PRAGMA table_info` / `PRAGMA index_list`） |
| staging での resolve → rollback → recompute の audit 3 行 + `response_fields` 整復 | 実 D1 + 実 admin actor 経路の end-to-end は unit/d1 test では再現しきれない | RAC-2 / `outputs/phase-11/recompute-runtime.md`（screenshot + SQL query 結果） |
| SchemaDiffPanel recompute ボタン + status バッジの visual baseline | pixel diff は Playwright visual でしか取れない | RAC-3 / `outputs/phase-11/visual-baseline.md`（task-18 visual-full 整合） |

これらは line coverage 対象外とし、Phase 11 runtime evidence（user-gated）で別途担保する。Phase 7 段階での coverage gap として許容する。

## AC トレース

| AC | 本 Phase での担保 |
| --- | --- |
| AC-1 | reverse-backfill happy path が `schemaAliasRecompute.spec.ts` / `schema.recompute.spec.ts` で coverage 対象 |
| AC-2 | idempotency edge (1)(2) が 2 回実行テストで貫かれる |
| AC-3 | audit edge が audit chain テストで貫かれる |
| AC-4 | GET status（不在時 null）が endpoint test で coverage 対象 |
| AC-7 | migration DDL は未カバー許容 → RAC-1 へ委譲 |
| AC-8 | exhausted continuation 分岐が coverage 対象 |

## 完了条件 (DoD)

- [ ] 新規 surface（workflow / repository / endpoint / web helper / UI）の concern マッピングが test file 単位で固定されている
- [ ] dependency edge（reverse-backfill ↔ job idempotency ↔ audit）の coverage が貫通テスト単位で可視化されている
- [ ] `@ubm-hyogo/api` / `@ubm-hyogo/web` の coverage 取得コマンドが実 package 名・実 script 名で記載されている
- [ ] 未カバー許容範囲（migration apply / staging runtime / visual baseline）が Phase 11 evidence へ委譲されている
- [ ] coverage が既存 baseline を下げないこと（`coverage-guard.sh --changed`）を判定基準にしている
