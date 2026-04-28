# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 4（テスト戦略） |
| 次 Phase | 6（異常系検証） |
| 状態 | pending |

## 目的

実装手順を runbook 化し、コード placeholder と擬似コードを書く。実装担当者がこの runbook を読めば順番通りに進められる粒度で記述する。本タスクは spec 生成に閉じるためコードは書かない。

## 実行タスク

1. 実装順序を runbook 化（module 作成 → SQL 検証 → endpoint 配線 → cron 配線 → e2e dry-run）。
2. 主要関数の擬似コードを書く（runSchemaSync / flatten / resolveStableKey / diffQueueWriter）。
3. sanity check command（pnpm typecheck / lint / test）を列挙。
4. local dev での検証手順を runbook に含める。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | module 配置 / Mermaid |
| 必須 | outputs/phase-04/main.md | test 戦略 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-details.md | wrangler / cron |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | sync flow |
| 参考 | docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-02/main.md | Wave 3a 詳細 |

## 実行手順

### ステップ 1: runbook 章立て確定
- 章 1: 前提（branch / env / D1 binding 確認）
- 章 2: module スケルトン作成
- 章 3: 関数本体実装
- 章 4: endpoint 配線
- 章 5: cron 配線
- 章 6: 単体 / 統合 test
- 章 7: local dev での dry run（wrangler dev + Forms API stub）

### ステップ 2: 擬似コード作成
- 後述「擬似コード」を参照、outputs/phase-05/pseudocode.md にも独立保存。

### ステップ 3: sanity check
- 後述「sanity check」を参照。

### ステップ 4: local dev 手順
- 後述「local dev runbook」を参照。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook が想定する正常路から外れた場合の異常系を 6 で扱う |
| Phase 7 | runbook 各章 → AC への対応付け |
| Phase 11 | runbook の手動 smoke 部分を 11 で実行 |
| Wave 9a | staging で本 runbook の sync を 1 度実行 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| stableKey 直書き | #1 | 擬似コードでも stableKey をリテラル記述しない（map 経由） |
| apps/api 限定 | #5 | runbook 全工程は apps/api ディレクトリ内 |
| schema 集約 | #14 | endpoint は `/admin/*` のみ追加 |
| 無料枠 | #10 | dev は wrangler local D1、本番 cron は 1 日 1 回 |
| 排他 | runbook | sync_jobs lock を最初に取得 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 章立て | 5 | pending | 7 章 |
| 2 | 擬似コード作成 | 5 | pending | runSchemaSync / flatten / resolve / diff |
| 3 | sanity check 列挙 | 5 | pending | typecheck / lint / test |
| 4 | local dev 手順 | 5 | pending | wrangler dev + stub |
| 5 | outputs 分離 | 5 | pending | sync-runbook.md / pseudocode.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook サマリ |
| ドキュメント | outputs/phase-05/sync-runbook.md | runbook 本文 |
| ドキュメント | outputs/phase-05/pseudocode.md | 擬似コード |
| メタ | artifacts.json | phase 5 を `completed` に更新 |

## 完了条件

- [ ] runbook が 7 章で書かれている
- [ ] 擬似コードが主要 4 関数を網羅
- [ ] sanity check 一覧がある
- [ ] local dev 手順が wrangler コマンドと一緒に記述

## タスク100%実行確認【必須】

- [ ] サブタスク 5 件すべて completed
- [ ] 擬似コードに stableKey 直書きが存在しない
- [ ] sync_jobs lock 取得が runbook 冒頭にある
- [ ] 異常時の rollback / cleanup が runbook 末尾にある
- [ ] artifacts.json の phase 5 が `completed`

## 次 Phase

- 次: 6（異常系検証）
- 引き継ぎ事項: runbook のうち「異常系」に分岐する条件
- ブロック条件: 擬似コード or sanity check 欠落

## runbook（章立て）

### 章 1: 前提
- branch: `feature/sync-schema`
- env: staging（dev branch）想定
- D1 binding: `DB`、`wrangler d1 migrations apply ubm_hyogo_staging --local`
- secret: `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` を `wrangler secret put` 済み

### 章 2: module スケルトン
- `apps/api/src/sync/schema/{index,forms-schema-sync,flatten,resolve-stable-key,diff-queue-writer,schema-hash}.ts` を作成（空 export）

### 章 3: 関数本体
- 後述「擬似コード」順で実装

### 章 4: endpoint 配線
- `apps/api/src/routes/admin.ts` に `app.post('/admin/sync/schema', adminGate, handler)` を追加
- handler: `runSchemaSync(c.env)` を呼び、`{ jobId, status }` を返す（409 は内部例外で識別）

### 章 5: cron 配線
- `apps/api/wrangler.toml` の `[triggers]` に `crons = ["*/15 * * * *", "0 18 * * *"]` を維持
- `apps/api/src/cron/index.ts` で `cron === '0 18 * * *'` 分岐に `runSchemaSync(env)` を追加

### 章 6: test
- `pnpm --filter @ubm-hyogo/api test` で unit + contract pass
- `pnpm typecheck` / `pnpm lint` pass

### 章 7: local dev dry run
- `pnpm --filter @ubm-hyogo/api dev`
- 別シェルから `curl -X POST http://localhost:8787/admin/sync/schema -H 'Authorization: Bearer <admin-session>'`
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_questions"` で 31 を確認

## 擬似コード

```ts
// apps/api/src/sync/schema/forms-schema-sync.ts
export async function runSchemaSync(env: Env): Promise<RunResult> {
  const jobId = crypto.randomUUID()
  const lock = await syncJobs.tryAcquire({ kind: 'schema_sync', jobId })
  if (!lock) throw new ConflictError('schema_sync already running')

  try {
    const form = await googleFormsClient.getForm(env.GOOGLE_FORM_ID)
    const items = flatten(form.items) // returns Array<FlatQuestion>
    if (countSections(form.items) !== 6) throw new SyncIntegrityError('section count != 6')
    if (items.length !== 31)             throw new SyncIntegrityError('item count != 31')

    const hash = await schemaHash(items)
    await schemaVersionsRepo.upsert({ revisionId: form.revisionId, formId: form.formId, schemaHash: hash, rawJson: form })

    for (const item of items) {
      const stableKey = await resolveStableKey({ questionId: item.questionId, title: item.title }, env)
      await schemaQuestionsRepo.upsert({ ...item, revisionId: form.revisionId, stableKey })
      if (!stableKey) await diffQueueWriter.enqueue({ questionId: item.questionId, diffKind: 'unresolved' })
    }

    await syncJobs.markSucceeded(jobId)
    return { jobId, status: 'succeeded' }
  } catch (e) {
    await syncJobs.markFailed(jobId, e)
    throw e
  }
}

// apps/api/src/sync/schema/flatten.ts
export function flatten(items: GoogleFormItem[]): FlatQuestion[] {
  let sectionIndex = 0
  const out: FlatQuestion[] = []
  for (const item of items) {
    if (item.pageBreakItem || item.sectionHeaderItem) { sectionIndex += 1; continue }
    if (!item.questionItem) continue
    out.push({
      questionId: item.questionItem.question.questionId,
      sectionIndex,
      title: item.title,
      kind: mapKind(item.questionItem.question),
      options: item.questionItem.question.choiceQuestion?.options ?? null,
      required: item.questionItem.question.required ?? false,
      visibility: 'public', // alias 経由で後で上書き
    })
  }
  return out
}

// apps/api/src/sync/schema/resolve-stable-key.ts
export async function resolveStableKey(input: { questionId: string, title: string }, env: Env): Promise<string | null> {
  const known = await schemaQuestionsRepo.findStableKeyByQuestionId(input.questionId)
  if (known) return known
  const aliased = await schemaAliasRepo.findByQuestionId(input.questionId)
  if (aliased) return aliased.stableKey
  return null // → diff queue へ
}

// apps/api/src/sync/schema/diff-queue-writer.ts
export const diffQueueWriter = {
  async enqueue(input: { questionId: string, diffKind: 'unresolved' | 'added' | 'changed' | 'removed' }) {
    await schemaDiffQueueRepo.upsertOpen(input)
  },
}
```

## sanity check

```bash
pnpm typecheck
pnpm lint
pnpm --filter @ubm-hyogo/api test
pnpm --filter @ubm-hyogo/api build
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT kind,status FROM sync_jobs ORDER BY started_at DESC LIMIT 5"
```

## local dev runbook

1. `pnpm install`
2. `pnpm --filter @ubm-hyogo/api db:migrate:local`
3. `wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL --local`（dev secret は別管理）
4. `pnpm --filter @ubm-hyogo/api dev`
5. 別 shell: `curl -X POST http://localhost:8787/admin/sync/schema -H 'Authorization: Bearer dev-admin'`
6. `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_questions"` → 31
7. `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_diff_queue WHERE status='open'"` → 0（既知のみのとき）
