[実装区分: 実装仕様書]

# Phase 4: 実装計画 — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
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
- phase-03.md

## 成果物

- phase-04.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | 編集 | `writeCapHit?: boolean` を zod schema に追加 |
| `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | `succeed()` payload に `writeCapHit` を渡し、cap hit 時 detector / emit を呼ぶ |
| `apps/api/src/jobs/cap-alert.ts` | 新規 | `evaluateConsecutiveCapHits` / `emitConsecutiveCapHitEvent` を export |
| `apps/api/src/jobs/cap-alert.test.ts` | 新規 | detector / emit の unit test |
| `apps/api/src/jobs/sync-forms-responses.test.ts` | 編集 | `writeCapHit` 記録ケースを追加 |
| `apps/api/src/jobs/__fixtures__/d1-fake.ts` | 編集 | `succeed()` payload に `writeCapHit` を保存できるよう拡張 |
| `apps/api/src/index.ts` (env type) | 編集 | `SYNC_ALERTS?: AnalyticsEngineDataset` を Env interface に追加 |
| `apps/api/wrangler.toml` | 編集 | `[[analytics_engine_datasets]]` ブロックを top / env.staging / env.production に追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集 | observability / cost guardrail 節に閾値・チャネル・escalation を追記 |
| `docs/30-workflows/task-03b-followup-006-per-sync-cap-alert/outputs/phase-12/runbook-per-sync-cap-alert.md` | 新規 | runbook 1 ページ |

## 差分方針

### `_shared/sync-jobs-schema.ts`

```diff
 export const metricsSchema = z.object({
   cursor: z.string().nullable().optional(),
   writes: z.number().int().nonnegative().optional(),
   processed: z.number().int().nonnegative().optional(),
   skipped: z.boolean().optional(),
+  writeCapHit: z.boolean().optional(),
   reason: z.string().optional(),
 }).passthrough();
```
- PII guard には影響しない（`writeCapHit` は許可リスト上）
- 後方互換: 既存呼び出しは変更不要、追加 caller のみで埋める

### `sync-forms-responses.ts`

- `runResponseSync()` 末尾の `succeed()` 直後に detector → emit のフローを挿入
- skipped path（lock 取得失敗）は `writeCapHit: false` 固定で問題なし
- error path (`fail()`) では detector を呼ばない（cap hit 由来でない可能性が高いため）

### `cap-alert.ts`（新規）

phase-03 の §2 シグネチャに従う。境界条件:
- `LIMIT 3` で 3 行未満なら `thresholdReached = false`
- `json_extract` が NULL の旧行は `false` 扱い（`COALESCE` で防御）
- `SYNC_ALERTS` binding 未定義時は warn のみで早期 return

### `wrangler.toml`

`[[d1_databases]]` の直前に同じインデントで Analytics Engine ブロックを追加。`env.production` / `env.staging` セクションも同様に追加し、dev / staging / prod すべてで同じ binding 名 `SYNC_ALERTS` を保証する。

## 実行順序

1. zod schema 拡張（破壊変更なし）
2. detector helper 新規追加（呼び出し元なし状態でも build 通る）
3. unit test 追加（cap-alert.test.ts）
4. wrangler.toml に binding 追加
5. `Env` 型に `SYNC_ALERTS` 追加
6. sync-forms-responses.ts 統合
7. 既存テスト更新
8. specs / runbook 追記

各ステップ後に `pnpm typecheck` を通す前提。

## 完了条件

- 上記すべてのファイルの差分方針が確定する
- Phase 5 のランブックに沿って実装着手できる粒度
