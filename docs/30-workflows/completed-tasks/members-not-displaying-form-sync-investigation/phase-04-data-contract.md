# Phase 4: データ契約

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 04 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- phase-01 / Phase 1
- phase-02 / Phase 2
- phase-03 / Phase 3
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## Diagnostic endpoint レスポンス拡張

既存 shape は `FormsPipelineSnapshotSchema` を維持する。`hypotheses` / `syncJobs` という別名は使わない。

```ts
{
  capturedAt: string,
  counts: { formResponses: number, responseFields: number, members: number, memberIdentities: number },
  latestSyncRuns: SyncRunSummary[],
  secretsReadiness: { googleServiceAccountEmail: boolean, googlePrivateKey: boolean, googleFormId: boolean, authSecret: boolean },
  aliasPendingCount: number,
  publicVisibility: PublicVisibilityCounts,
  identityHealth: IdentityHealth,
  hypothesisFlags: {
    H1_ingestNeverRanOrAllErrors: boolean,
    H2_identityMismatchSuspected: boolean,
    H3_allHiddenByPublishState: boolean,
    H4_aliasPendingNonZero: boolean
  },
  publicConsentBreakdown: { consented: number, declined: number, unknown: number },
  publishStateBreakdown: {
    public: number,
    member_only: number,
    hidden: number,
    legacy_published: number,
    legacy_private: number
  },
  visiblePublicCount: number,
  lastSuccessfulSyncAt: string | null,
  totals: { memberIdentities: number, memberResponses: number, memberStatus: number }
}
```

`visiblePublicCount` は `/api/public/members` と同じ公開境界に合わせる。

```sql
SELECT COUNT(*) AS n
FROM member_status s
WHERE s.public_consent = 'consented'
  AND s.publish_state = 'public'
  AND s.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM identity_aliases ia
    WHERE ia.source_member_id = s.member_id
  )
```

`lastSuccessfulSyncAt` は DB 保存値の互換を吸収する。

```sql
SELECT MAX(finished_at) AS t
FROM sync_jobs
WHERE job_type IN ('response_sync', 'forms_response_sync')
  AND status IN ('success', 'succeeded')
```

## Backfill endpoint contract

```
POST /admin/sync/backfill-publish-state?dryRun=true
Authorization: Bearer <SYNC_ADMIN_TOKEN>
```

```ts
{
  dryRun: boolean,
  policy: "auto-publish-on-consent",
  scanned: number,
  candidates: number,
  applied: number,
  skipped: {
    alreadyPublic: number,
    adminExplicit: number,
    consentNotMet: number,
    deleted: number
  }
}
```

## Sync policy 関数契約

```ts
export type PublishState = "public" | "member_only" | "hidden";
export type ConsentValue = "consented" | "declined" | "unknown";

export type AutoPublishInput = {
  currentPublishState: PublishState;
  publicConsent: ConsentValue;
  hasAdminExplicitOverride: boolean;
  flagEnabled: boolean;
};

export function decidePublishState(input: AutoPublishInput): PublishState;
export function isAdminOverrideStatus(input: {
  currentPublishState: PublishState;
  updatedBy: string | null;
}): boolean;
```

| flagEnabled | currentPublishState | publicConsent | hasAdminExplicitOverride | result |
| --- | --- | --- | --- | --- |
| false | any | any | any | currentPublishState |
| true | member_only | consented | false | public |
| true | member_only | consented | true | member_only |
| true | member_only | declined | any | member_only |
| true | member_only | unknown | any | member_only |
| true | hidden | consented | any | hidden |
| true | public | any | any | public |

Legacy DB 値 `published/private` が残っている場合、policy 入力前に `published -> public`、`private -> hidden` へ正規化する。public directory の SQL は legacy `published` を公開扱いしない。
