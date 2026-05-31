# Phase 4: データ契約

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 04 |
| state | implemented_local_runtime_pending |
| implementation_mode | verify_existing + コード変更 1 点 |

## 目的

本 Phase は production rollout に関与する既存実装の**入出力契約を current facts として固定**する。本ワークフローは新規モジュールを追加しないため、ここに記す契約はすべて `apps/api/src` 配下の既存実装の現状を逐語で記述したものであり、Task A の flag 変更後も**契約自体は不変**である（挙動切替は flag 値が握る）。唯一の変更点は `apps/api/wrangler.toml` の production `[env.production.vars]` flag 値であり、その config 契約も本 Phase に含める。

## 4.1 auto-publish policy 契約（`decidePublishState`）

正本: `apps/api/src/lib/policies/auto-publish.ts`（不変・再利用）。

### 型定義（現状）

```ts
export type PublishState = "public" | "member_only" | "hidden";
export type ConsentValue = "consented" | "declined" | "unknown";

export interface AutoPublishInput {
  readonly currentPublishState: PublishState;
  readonly publicConsent: ConsentValue;
  readonly hasAdminExplicitOverride: boolean;
  readonly flagEnabled: boolean;
}

export function decidePublishState(input: AutoPublishInput): PublishState;
export function isAdminOverrideStatus(input: {
  readonly currentPublishState: PublishState;
  readonly updatedBy: string | null;
}): boolean;
export function normalizePublishState(raw: string | null | undefined): PublishState;
export function normalizeConsentValue(raw: string | null | undefined): ConsentValue;
```

### `decidePublishState` 遷移表（AutoPublishInput → PublishState）

| flagEnabled | currentPublishState | publicConsent | hasAdminExplicitOverride | result |
| --- | --- | --- | --- | --- |
| `false` | any | any | any | currentPublishState（現状維持） |
| `true` | any | any | `true` | currentPublishState（admin override 尊重） |
| `true` | `public` | any | `false` | `public`（維持） |
| `true` | `hidden` | any | `false` | `hidden`（維持） |
| `true` | `member_only` | `consented` | `false` | `public`（昇格） |
| `true` | `member_only` | `declined` | `false` | `member_only`（維持） |
| `true` | `member_only` | `unknown` | `false` | `member_only`（維持） |

> production flag を `"true"` にする本タスクの意味は、上表の `flagEnabled=true` 行を runtime で有効化すること。すなわち consent 済 `member_only` を `public` へ昇格させる経路を本番でも開く。

### `isAdminOverrideStatus` 契約（admin override 判定 / 不変）

- `currentPublishState === "hidden"` → `true`（admin による明示非公開）。
- `updatedBy` が非 null かつ長さ > 0 かつ `system:` で**始まらない** → `true`（admin/user が直接編集）。
- それ以外 → `false`。

> 不変条件 #4 の根拠。backfill / sync は override を上書きしない。

### 正規化契約（legacy 吸収）

- `normalizePublishState`: `public`|`published` → `public` / `hidden`|`private` → `hidden` / その他 (null / unknown 含む) → `member_only`。
- `normalizeConsentValue`: `consented` → `consented` / `declined` → `declined` / その他 → `unknown`。
- canonical publish_state は `public` / `member_only` / `hidden`。legacy `published` / `private` は policy 入力前に正規化され、公開フィルタは legacy `published` を公開扱いしない。

## 4.2 sync job 適用契約（`sync-forms-responses.ts`）

正本: `apps/api/src/jobs/sync-forms-responses.ts`（不変・再利用）。

- flag 読み取り: `parseAutoPublishFlag(env)` が `env.MEMBERS_AUTO_PUBLISH_ON_CONSENT` を読み、`String.toLowerCase() === "true"` のときのみ `true`（未設定 / その他は `false`）。
- flag 有効時、`decidePublishState({ ..., flagEnabled: true })` を適用し、昇格時は `member_status.publish_state` を UPDATE、`updated_by='system:sync'` を付与する。
- 書き込み見積 `estimateResponseWrites()` は auto-publish 有効時に `+1 write` を見込む。

> **時間契約**: flag を `"true"` にしても、それは deploy 後の**新規 / 更新 sync 時にのみ**既存 `member_only` を昇格する。既存 record の一括昇格は backfill apply（4.3）が担う。flag 変更（Task A）と backfill（Task C）は両輪。

## 4.3 backfill endpoint 契約（`runBackfillPublishState`）

正本: `apps/api/src/routes/admin/sync-backfill-publish-state.ts`（不変・再利用 / `index.ts` 登録済み）。

### request

```
POST /admin/sync/backfill-publish-state?dryRun=true|false
Authorization: Bearer <SYNC_ADMIN_TOKEN>
```

- `dryRun` query: `"false"` の場合のみ apply。それ以外（未指定含む）は **default `dryRun=true`**（`dryRunParam !== "false"`）。
- auth: `requireSyncAdmin` ミドルウェア。非 admin token は拒否。

### response（`BackfillResult` / 200）

```ts
export interface BackfillResult {
  dryRun: boolean;
  policy: "auto-publish-on-consent";
  scanned: number;
  candidates: number;
  applied: number;
  skipped: {
    alreadyPublic: number;
    adminExplicit: number;
    consentNotMet: number;
    deleted: number;
  };
}
```

### フィールド意味契約

| フィールド | 意味 |
| --- | --- |
| `dryRun` | リクエストの dry-run 区分。`true`=UPDATE しない |
| `policy` | 固定値 `"auto-publish-on-consent"` |
| `scanned` | `member_status` 全行数 |
| `candidates` | 昇格対象（`member_only` + consented + 非 override + 非 deleted）件数 |
| `applied` | 実 UPDATE 件数。`dryRun=true` のとき常に `0` |
| `skipped.alreadyPublic` | 既に `public`（昇格不要） |
| `skipped.adminExplicit` | `isAdminOverrideStatus=true`（hidden / 非 `system:` updated_by） |
| `skipped.consentNotMet` | consent 未達（declined / unknown）で `member_only` 維持 |
| `skipped.deleted` | `is_deleted=1` |

### apply 副作用契約

- 走査クエリ: `SELECT member_id, public_consent, publish_state, updated_by, is_deleted FROM member_status`。
- apply 時 UPDATE: `publish_state = ?nextState`, `updated_by = 'system:backfill'`, `updated_at = datetime('now')`。`BATCH = 200` 件単位の `db.batch()`。
- idempotent: 再実行すると昇格済み record は `skipped.alreadyPublic` に落ち `applied=0`。

## 4.4 diagnostics snapshot 契約（`getFormsPipelineSnapshot`）

正本: `apps/api/src/diagnostics/forms-pipeline.ts` を `apps/api/src/routes/admin/sync-diagnostics.ts`（`GET /admin/sync/diagnostics/forms-pipeline`, `requireSyncAdmin`）が CLI 経路で公開。

### 本タスクで参照する主要フィールド

| フィールド | 型 | 意味 |
| --- | --- | --- |
| `capturedAt` | `string` | snapshot 取得時刻（ISO） |
| `visiblePublicCount` | `number` | 公開フィルタ（4.5）+ `identity_aliases` 非存在を満たす可視会員数 |
| `publishStateBreakdown` | `{ public, member_only, hidden, legacy_published, legacy_private }` | publish_state 別件数 |
| `publicConsentBreakdown` | `{ consented, declined, unknown }` | consent 別件数 |
| `lastSuccessfulSyncAt` | `string \| null` | `response_sync`/`forms_response_sync` の `success`/`succeeded` 最新 `finished_at` |
| `totals` | `{ memberIdentities, memberResponses, memberStatus }` | 各テーブル総数 |
| `hypothesisFlags` | `{ H1_…, H2_…, H3_…, H4_… }` | 仮説フラグ（既存 key 名維持） |
| `secretsReadiness` | `{ googleServiceAccountEmail, googlePrivateKey, googleFormId, authSecret }` | secret 投入有無（値は返さない） |

### `visiblePublicCount` の SQL 契約（公開境界と一致）

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

> runtime 検証の主要 KPI。backfill apply 前後で `visiblePublicCount` の増加を確認する（Phase 6 / Task B / Task C）。

## 4.5 公開フィルタ契約（不変条件 #1）

正本: `apps/api/src/_shared/public-filter.ts` + `apps/api/src/repository/publicMembers.ts`。

- 公開条件: `public_consent='consented' AND publish_state='public' AND is_deleted=0`。
- `buildPublicWhereParams()` は `{ publicConsent: "consented", publishState: "public", isDeleted: 0 }` を返す。`isPublicStatus()` も同条件。
- **本タスクでこの条件は一切変更しない**。会員可視化は record 側の `publish_state` を `public` に正すこと（flag + backfill）でのみ達成する。

## 4.6 config 契約（`wrangler.toml` flag / Task A の唯一の変更点）

正本: `apps/api/wrangler.toml`。

| env | 行 | 現状 | Task A 後 |
| --- | --- | --- | --- |
| staging（`[env.staging.vars]`） | 162 | `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"` | `"true"`（変更なし） |
| production（`[env.production.vars]`） | 72 | `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"` | **適用済み。deploy は Gate-C user-gated** |

- 値域: 文字列 `"true"` / `"false"`。`parseAutoPublishFlag` が `toLowerCase() === "true"` で解釈するため、`"true"` 以外（未設定含む）は OFF 扱い。
- Task A 完了後は staging / production とも `"true"` で drift なし（DoD で `rg` 確認）。

## 完了条件

- [x] 必須セクションが存在する。
- [x] auto-publish policy の入出力契約と遷移表を current facts として固定した。
- [x] backfill / diagnostics / 公開フィルタ / flag config の契約を既存実装の identifier で記述した。

## 実行タスク

1. auto-publish policy の入出力契約（`decidePublishState` 遷移表）を current facts として記述する。
2. backfill / diagnostics endpoint の request/response 契約を記述する。
3. 公開フィルタと wrangler.toml flag の config 契約（不変条件）を固定する。

## 参照資料

- `apps/api/src/lib/policies/auto-publish.ts`
- `apps/api/src/routes/admin/sync-backfill-publish-state.ts`
- `apps/api/src/diagnostics/forms-pipeline.ts`
- `apps/api/src/_shared/public-filter.ts`

## 成果物

- 本 `phase-04-data-contract.md`（policy / backfill / diagnostics / 公開フィルタ / config 契約）。

## 統合テスト連携

契約はすべて既存 spec（auto-publish.spec.ts / sync-backfill-publish-state.spec.ts / sync-diagnostics.contract.spec.ts）で検証済み。本タスクは契約を変更しないため、Phase 6 の回帰確認で契約不変を担保する。
