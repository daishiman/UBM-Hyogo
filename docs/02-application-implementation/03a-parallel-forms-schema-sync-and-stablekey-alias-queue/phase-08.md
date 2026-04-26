# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | pending |

## 目的

命名 / 型 / path / endpoint を整理し、03b と共通化できる部分（sync_jobs ledger / lock / google client）を共有モジュールへ寄せる。

## 実行タスク

1. naming Before/After を表化（schema-sync 系の関数名・table 名）。
2. 型 Before/After を表化（FlatQuestion / SyncResult / SyncError）。
3. endpoint Before/After を確認（`POST /admin/sync/schema` のみ追加）。
4. 共通モジュール候補を列挙（`apps/api/src/sync/_shared/lock.ts` / `_shared/ledger.ts`）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | module 配置 |
| 必須 | outputs/phase-05/pseudocode.md | 関数名 |
| 必須 | outputs/phase-07/ac-matrix.md | 影響範囲 |
| 参考 | doc/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/ | 並列タスク（共通化候補） |

## 実行手順

### ステップ 1: naming Before/After
- 後述参照。

### ステップ 2: type Before/After
- 後述参照。

### ステップ 3: endpoint 確認
- `POST /admin/sync/schema` のみ。`/admin/schema/diff`（GET）は 04c 担当のため本タスクで定義しない。

### ステップ 4: 共通モジュール
- 03b と共有: `syncJobs.tryAcquire / markSucceeded / markFailed` を `_shared/ledger.ts` に置く。
- googleFormsClient 自体は 01b で提供済み。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 後のモジュールに対して品質チェック |
| 並列 03b | 共通モジュール契約を確定 |
| Wave 8a | 共通モジュールの contract test |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| stableKey 直書き | #1 | naming に stableKey リテラルが残らないか |
| schema 集約 | #14 | endpoint が `/admin/*` に閉じる |
| apps/api 限定 | #5 | sync 共通モジュールも apps/api 配下 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | naming Before/After | 8 | pending | - |
| 2 | type Before/After | 8 | pending | - |
| 3 | endpoint 確認 | 8 | pending | 1 件のみ追加 |
| 4 | 共通モジュール抽出 | 8 | pending | 03b 連携 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY サマリ |
| メタ | artifacts.json | phase 8 を `completed` に更新 |

## 完了条件

- [ ] naming / type / endpoint / 共通モジュールの Before/After が 4 表で揃う
- [ ] 03b との共通化箇所が明確

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] 共通モジュール契約が 03b と一致
- [ ] endpoint 表に 04c 担当との重複がない
- [ ] artifacts.json の phase 8 が `completed`

## 次 Phase

- 次: 9（品質保証）
- 引き継ぎ事項: 共通モジュールの存在
- ブロック条件: 命名衝突あり

## naming Before / After

| 項目 | Before（思いつき） | After（採用） |
| --- | --- | --- |
| job entry | `syncSchema` | `runSchemaSync` |
| flatten | `parseItems` | `flatten` |
| stableKey 解決 | `findKey` | `resolveStableKey` |
| diff 投入 | `addDiff` | `diffQueueWriter.enqueue` |
| ledger lock | `lockJob` | `syncJobs.tryAcquire` |
| ledger close | `closeJob` | `syncJobs.markSucceeded` / `markFailed` |
| table | `schema_versions` / `schema_questions` / `schema_diff_queue` / `sync_jobs` | 同上（既出 01a） |

## type Before / After

| 項目 | Before | After |
| --- | --- | --- |
| 平坦化結果 | `Array<any>` | `Array<FlatQuestion>` |
| sync 結果 | `boolean` | `{ jobId: string; status: 'succeeded' \| 'failed' \| 'started' \| 'conflict' }` |
| sync エラー | `Error` | `class SyncError extends Error { code; payload }` |
| diff 種別 | `string` | `type DiffKind = 'added' \| 'changed' \| 'removed' \| 'unresolved'` |
| ledger 状態 | `string` | `type JobStatus = 'running' \| 'succeeded' \| 'failed'` |

## endpoint Before / After

| endpoint | 担当 | 本タスク追加? |
| --- | --- | --- |
| `POST /admin/sync/schema` | 04c → runSchemaSync 呼び出し | 本タスクが job 関数を提供 |
| `POST /admin/sync/responses` | 03b 担当 | NO |
| `GET /admin/schema/diff` | 04c 担当 | NO |
| `POST /admin/schema/aliases` | 04c + 07b | NO |

## 共通モジュール候補

| ファイル | 共通範囲 | 03b との契約 |
| --- | --- | --- |
| `apps/api/src/sync/_shared/ledger.ts` | tryAcquire / markSucceeded / markFailed | kind 列で識別 |
| `apps/api/src/sync/_shared/sync-error.ts` | SyncError class | code 列挙 |
| `apps/api/src/sync/_shared/cron-router.ts` | cron expression → handler 振分 | 03a と 03b で別 cron |
