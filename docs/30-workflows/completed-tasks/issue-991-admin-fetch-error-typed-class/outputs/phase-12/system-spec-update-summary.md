# システム仕様更新サマリー — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## Step 1-A: タスク完了記録
- 本ワークフローは `implemented_local_evidence_captured`。実装・focused tests・typecheck・lint・aiworkflow-requirements ledger 同期を本サイクルで記録する。

## Step 1-B: 実装状況テーブル
- `AdminFetchError` 実装状況 = `implemented_local_evidence_captured`。
- `apps/web/src/lib/admin/server-fetch.ts`: `AdminFetchError` / `isAdminFetchError` を export し、error path を typed throw へ置換。body snippet は email / phone 形状を redaction 済み。
- `apps/web/src/lib/server-fetch/safe-fetch.ts`: admin import なしで構造化 `status` を優先し、既存 message regex fallback を維持。

## Step 1-C: 関連タスクテーブル
- 親 `admin-audit-prototype-alignment` FU-001（Issue #991）= 本 workflow で consumed / implemented。元 follow-up 仕様は historical source として保持。

## Step 2: system spec 更新判定（新規インターフェース追加時のみ）

| 判定 | 結果 |
| --- | --- |
| 新規インターフェース追加 | **Yes**（`AdminFetchError` / `isAdminFetchError`） |
| 本サイクルでの正本仕様更新 | **Done**（aiworkflow-requirements quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS） |

正本追記内容:
- admin API transport 失敗は `AdminFetchError`（`status` / `path` / `responseBodySnippet`）で表現する。
- message format は後方互換のため非 PII body では既存 `admin api ${path} failed: ${status} body=${body.slice(0,256)}` を維持する。
- `responseBodySnippet` は 500 文字上限。message suffix は 256 文字上限。どちらも email / phone 形状を snippet 化前に redaction する。
- 共通正規化 `safe-fetch.ts` は admin module を import せず、duck typing で構造化 `status` を優先し、未提供時は既存正規表現 fallback を維持する。

## 不変条件整合
- 不変条件 #5（D1 直接アクセスは apps/api に閉じる）: 影響なし
- 不変条件 #8（`*.spec.ts` のみ）: 新規 test は `admin-fetch-error.spec.ts` で準拠
- UI prototype alignment 不変条件 #1（既存 API のみ）: apps/api 変更なしで準拠
