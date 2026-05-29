# Task A: Runtime diagnosis 強化と ops script

`[実装区分: 実装仕様書]`

## 目的

既存 `getFormsPipelineSnapshot()` を拡張し、H1/H2/H3/H4 のどれが真因かを runtime evidence で確定できるようにする。CLI からは sync-token protected endpoint を叩く。

## 変更対象ファイル

| Path | 種別 |
| --- | --- |
| `apps/api/src/diagnostics/forms-pipeline.ts` | 編集 |
| `apps/api/src/diagnostics/schema.ts` | 編集 |
| `apps/api/src/diagnostics/forms-pipeline.spec.ts` | 編集 |
| `apps/api/src/diagnostics/forms-pipeline.contract.spec.ts` | 編集 |
| `apps/api/src/routes/admin/sync-diagnostics.ts` | 新規 |
| `apps/api/src/index.ts` | 編集 |
| `scripts/diagnose-members-pipeline.sh` | 新規 (+x) |

## 関数と schema

新規 `diagnoseFormsPipeline()` は作らない。既存 export を維持する。

```ts
export async function getFormsPipelineSnapshot(env: Pick<Env, "DB" | ...>): Promise<FormsPipelineSnapshot>;
export const FormsPipelineSnapshotSchema = z.object({ ...追加フィールド });
```

## SQL

- breakdown: `member_status` の `public_consent` / `publish_state` 集計。canonical `hidden` と legacy `private/published` は別 bucket で可視化する。
- visible count: public repository と同じ `public_consent='consented' AND publish_state='public' AND is_deleted=0` + canonical alias source exclusion。
- last successful sync: `job_type IN ('response_sync','forms_response_sync')` + `status IN ('success','succeeded')`。
- totals: identities / responses / status の 3 件。

## 診断 script

`scripts/diagnose-members-pipeline.sh --env staging`:

- default env は `staging`。
- `SYNC_ADMIN_TOKEN` を env-scoped secret として取得し、値はログに出さない。
- `GET /api/admin/sync/diagnostics/forms-pipeline` を叩く。
- jq で `hypothesisFlags`、breakdown、visible count、last sync、totals、diagnosis を出す。

## テスト

- `forms-pipeline.spec.ts`: breakdown、visible count、last sync の pure/unit ケース。
- `forms-pipeline.contract.spec.ts`: 既存 `/admin/diagnostics/forms-pipeline` が追加 field を返し、secret readiness が boolean-only のまま。
- `sync-diagnostics.contract.spec.ts`: `SYNC_ADMIN_TOKEN` なし/不一致 401 or 500、正常時 200。

## DoD

- [ ] `FormsPipelineSnapshotSchema` が追加 field を parse する
- [ ] H2/H4 キー名は既存 `H2_identityMismatchSuspected` / `H4_aliasPendingNonZero` のまま
- [ ] CLI は `requireAdmin` endpoint ではなく sync-token endpoint を使う
- [ ] visible count と public members SQL の境界が一致する
- [ ] script が staging で JSON を出力する（user-gated）
