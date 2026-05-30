# Phase 2: アーキテクチャ

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 02 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- phase-01 / Phase 1
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## パイプライン現状図

```
Google Form
   -> Forms API (packages/integrations/google/src/forms-client.ts)
   -> Cron "*/15 * * * *" / POST /admin/sync/responses
   -> runResponseSync() (apps/api/src/jobs/sync-forms-responses.ts)
      -> setConsentSnapshot() -> member_status
         public_consent = consented|declined|unknown
         rules_consent  = consented|declined|unknown
         publish_state  = DB default 'member_only'
   -> GET /api/public/members
      WHERE public_consent='consented'
        AND publish_state='public'
        AND is_deleted=0
        AND canonical alias source is excluded
```

## 根本原因仮説マッピング

| ID | 実装上のキー | 仮説 | 検証 | 修復責務 |
| --- | --- | --- | --- | --- |
| H1 | `H1_ingestNeverRanOrAllErrors` | sync_jobs に成功 run が無い | `latestSyncRuns` と `lastSuccessfulSyncAt` | 既存 #956 runbook |
| H2 | `H2_identityMismatchSuspected` | identity と status/response の不整合 | `identityHealth` と totals | 既存 #957 runbook |
| H3 | `H3_allHiddenByPublishState` | status はあるが公開条件を満たさない | `publicConsentBreakdown` / `publishStateBreakdown` / `visiblePublicCount` | 本仕様 Task B + C |
| H4 | `H4_aliasPendingNonZero` | schema alias 未解決 | `aliasPendingCount` | 既存 #959 runbook |

最有力は H3。`publish_state` の canonical 値は `public | member_only | hidden` であり、legacy 値 `published/private` は admin 一覧では正規化されるが public directory では公開対象にしない。本仕様では public directory の正本 SQL に合わせ、visible count は `publish_state='public'` のみを数える。

## 設計判断

### D-01: Policy は feature flag で導入

`MEMBERS_AUTO_PUBLISH_ON_CONSENT` (default `"false"`) を `ResponseSyncEnv` / `Env` / `wrangler.toml` に追加する。sync 時に `setConsentSnapshot` 後、`public_consent='consented'` かつ admin override なしの場合だけ `publish_state='public'` にする。

- 配置: `apps/api/src/lib/policies/auto-publish.ts` の純関数。
- override 判定: 現行 schema に `member_status_history` は存在しないため、`member_status.updated_by` と `publish_state='hidden'` だけを使う。
- write cap: 追加 UPDATE 分を `writeCount` と `estimateResponseWrites` に反映する。

### D-02: Backfill は sync token namespace に寄せる

既存 sync 系と同じ `SYNC_ADMIN_TOKEN` 境界に寄せ、`POST /admin/sync/backfill-publish-state?dryRun=true|false` を `requireSyncAdmin` で保護する。新規 `maintenance` namespace は作らない。

### D-03: 診断 endpoint は既存 schema を拡張する

既存正本は `apps/api/src/diagnostics/schema.ts` の `FormsPipelineSnapshotSchema`。新規 `forms-pipeline.schema.ts` は作らず、`getFormsPipelineSnapshot()` の返却に以下を追加する。

```ts
{
  publicConsentBreakdown: { consented: number, declined: number, unknown: number },
  publishStateBreakdown: { public: number, member_only: number, hidden: number, legacy_published: number, legacy_private: number },
  visiblePublicCount: number,
  lastSuccessfulSyncAt: string | null,
  totals: { memberIdentities: number, memberResponses: number, memberStatus: number }
}
```

診断 script は human admin JWT が必要な `/admin/diagnostics/forms-pipeline` を直接叩かない。CLI から実行可能にするため、同じ snapshot builder を呼ぶ sync-token protected endpoint `GET /admin/sync/diagnostics/forms-pipeline` を追加し、script はそこを叩く。

## 依存

- `apps/api/src/diagnostics/{forms-pipeline,schema}.ts`
- `apps/api/src/jobs/sync-forms-responses.ts`
- `apps/api/src/repository/publicMembers.ts`
- `apps/api/migrations/0002_admin_managed.sql`
- `apps/api/src/middleware/require-sync-admin.ts`
