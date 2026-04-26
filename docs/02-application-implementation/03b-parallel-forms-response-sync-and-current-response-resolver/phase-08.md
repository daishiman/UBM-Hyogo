# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | pending |

## 目的

命名 / 型 / endpoint を整理し、03a と共通化できる部分（sync_jobs ledger / SyncError）を共有モジュールへ寄せる。03b 単独の概念（cursor / consent snapshot）と共通の概念を切り分ける。

## 実行タスク

1. naming Before/After。
2. 型 Before/After。
3. endpoint 確認。
4. 共通モジュール候補（03a 連携）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | module |
| 必須 | outputs/phase-05/pseudocode.md | 関数名 |
| 必須 | outputs/phase-07/ac-matrix.md | 影響範囲 |
| 参考 | doc/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/ | 並列タスク |

## 実行手順

### ステップ 1: naming Before/After
- 後述参照。

### ステップ 2: 型 Before/After
- 後述参照。

### ステップ 3: endpoint
- `POST /admin/sync/responses` のみ追加。

### ステップ 4: 共通モジュール
- 03a と共通: `_shared/ledger.ts` / `_shared/sync-error.ts`
- 03b 単独: `cursor-store.ts` / `pick-current-response.ts` / `snapshot-consent.ts`

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 後のモジュールに対して品質チェック |
| 並列 03a | 共通モジュール契約確定 |
| Wave 8a | 共通モジュール test |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー | #2 | naming に `ruleConsent` 出さない |
| responseEmail | #3 | type に system field 区別 |
| ID 混同 | #7 | Brand 型を共通モジュール export |
| schema 集約 | #14 | endpoint は `/admin/*` のみ |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | naming Before/After | 8 | pending | - |
| 2 | type Before/After | 8 | pending | - |
| 3 | endpoint 確認 | 8 | pending | 1 件 |
| 4 | 共通モジュール抽出 | 8 | pending | 03a 連携 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY サマリ |
| メタ | artifacts.json | phase 8 を `completed` |

## 完了条件

- [ ] 4 表揃う
- [ ] 03a との共通化箇所明確

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] 共通モジュール契約が 03a と一致
- [ ] artifacts.json の phase 8 が `completed`

## 次 Phase

- 次: 9（品質保証）

## naming Before / After

| 項目 | Before | After |
| --- | --- | --- |
| job entry | `syncResponses` | `runResponseSync` |
| 正規化 | `mapAnswers` | `normalizeAnswer` |
| consent | `parseConsent` | `extractConsent` |
| 同意正規化 | `toEnum` | `normalizeConsent` |
| identity | `findOrInsert` | `resolveIdentity` |
| current | `setLatest` | `pickCurrentResponse` |
| status | `applyStatus` | `snapshotConsent` |
| cursor | `paginationToken` | `cursorStore` |
| ledger | （03a と共通） | `syncJobs.tryAcquire / markSucceeded / markFailed` |
| consent enum | `Consent` | `ConsentStatus = 'consented'\|'declined'\|'unknown'` |

## type Before / After

| 項目 | Before | After |
| --- | --- | --- |
| memberId | `string` | `MemberId = Brand<string,'MemberId'>` |
| responseId | `string` | `ResponseId = Brand<string,'ResponseId'>` |
| stableKey | `string` | `StableKey = Brand<string,'StableKey'>` |
| consent | `string` | `ConsentStatus` |
| sync 結果 | `boolean` | `{ jobId, status, processedCount? }` |
| sync エラー | `Error` | `SyncError extends Error { code; payload }`（03a 共通） |
| 正規化結果 | `any` | `{ known: Map<StableKey, string>; unknown: Map<string, string> }` |

## endpoint Before / After

| endpoint | 担当 | 本タスク追加? |
| --- | --- | --- |
| `POST /admin/sync/responses` | 04c handler → runResponseSync | 本タスクが job 関数提供 |
| `?fullSync=true` query | 04c が forward | 本タスクが option として受ける |
| `POST /admin/sync/schema` | 03a 担当 | NO |

## 共通モジュール候補

| ファイル | 共通範囲 | 03a との契約 |
| --- | --- | --- |
| `apps/api/src/sync/_shared/ledger.ts` | tryAcquire(kind) / markSucceeded / markFailed | kind ∈ {schema_sync, response_sync} |
| `apps/api/src/sync/_shared/sync-error.ts` | SyncError class | code 列挙を別ファイル `sync-error-codes.ts` に分離 |
| `packages/shared/src/types/brand.ts` | Brand<> 型 | MemberId / ResponseId / StableKey / TagCode 等を統一 export |
