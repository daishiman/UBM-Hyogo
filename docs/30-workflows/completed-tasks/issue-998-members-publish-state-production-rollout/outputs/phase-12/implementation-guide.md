# Implementation Guide Reflection

## Part 1: 中学生にもわかる説明（plain-language）

### なぜこの問題が起きているか

学校の「部活メンバー名簿」を想像してください。新しく入部した人は、入部届を出すと自動で名簿に名前が載るはずです。ところが今は、入部届（公開の同意）を出したのに、名簿（公開ページ `/members`）に名前が出てきません。困りますよね。

理由は 2 つあります。

1. **自動で名簿に載せるスイッチが、実際の本番環境にはまだ反映されていない。** local config では ON に変更済みですが、本物のサイト（production）は deploy されるまで旧設定のままです。だから、新しく同意した人がいても名簿に追加されません。
2. **スイッチを ON にしても、すでに同意済みだった人は自動では載らない。** スイッチは「これから同意する人」だけを名簿に載せます。前から同意していたのに名簿外だった人は、もう一度「名簿に入れ直す作業」（backfill）をしないと載りません。

### 何をするか

- まず、本番のスイッチを「OFF → ON」に切り替えました（これがコードの変更で、たった 1 行です）。
- 次に、すでに同意していたのに名簿外だった人を「入れ直す作業」をします。ただし、先生（管理者）が「この人は名簿に載せない」とわざわざ設定した人（hidden）は、勝手に載せないように守ります。
- 入れ直す前に必ず「これから何人載せる予定か」を試し計算（dry-run）し、人数を確認してから本番作業します。間違えたときに元に戻せるよう、作業前に名簿のバックアップも取ります。
- 練習環境で先に試して安全を確かめてから、本番に進みます。

これで、同意した会員の名前がちゃんと公開ページに表示されるようになります。

## Part 2: 技術者向けサマリー（technical）

### 唯一のコード変更

`apps/api/wrangler.toml` の production `[env.production.vars]`（line 72 付近）:

```toml
# 変更前
MEMBERS_AUTO_PUBLISH_ON_CONSENT = "false"
# 変更後
MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"
```

staging（line 162 付近）は既に `"true"`。production へ揃える。新規シンボル・新規テスト追加なし。

### auto-publish policy（既実装・不変）

`apps/api/src/lib/policies/auto-publish.ts`:

```ts
export type PublishState = "public" | "member_only" | "hidden";
export type ConsentValue = "consented" | "declined" | "unknown";

export interface AutoPublishInput {
  readonly currentPublishState: PublishState;
  readonly publicConsent: ConsentValue;
  readonly hasAdminExplicitOverride: boolean;
  readonly flagEnabled: boolean;
}

export function decidePublishState(input: AutoPublishInput): PublishState {
  if (!input.flagEnabled) return input.currentPublishState;
  if (input.hasAdminExplicitOverride) return input.currentPublishState;
  if (input.currentPublishState === "public") return "public";
  if (input.currentPublishState === "hidden") return "hidden";
  // currentPublishState === "member_only"
  return input.publicConsent === "consented" ? "public" : "member_only";
}
```

- `member_only` + `publicConsent==='consented'` のときだけ `public` へ昇格。
- `hidden` / `hasAdminExplicitOverride` は維持（admin override 保護）。`isAdminOverrideStatus` は `publish_state='hidden'` または `updated_by` が非 `system:` のとき true。
- sync 統合は `apps/api/src/jobs/sync-forms-responses.ts`（flag 有効時に consent snapshot 直後で policy 評価、差異時のみ `UPDATE member_status ... updated_by='system:sync'`）。

### backfill endpoint（既実装・不変）

`apps/api/src/routes/admin/sync-backfill-publish-state.ts` の `runBackfillPublishState`:

- `POST /admin/sync/backfill-publish-state?dryRun=true|false`（`dryRun` 既定 = true。`dryRunParam !== "false"`）。
- response 形:

```jsonc
{
  "dryRun": true,
  "scanned": 0,
  "candidates": 0,
  "applied": 0,
  "skipped": { "alreadyPublic": 0, "adminExplicit": 0, "consentNotMet": 0, "deleted": 0 }
}
```

- apply 時は 200 件単位の `db.batch()` で `UPDATE member_status SET publish_state=..., updated_by='system:backfill', ...`。再実行は idempotent（applied=0 へ収束）。

### 公開フィルタ SQL（既存・不変）

`apps/api/src/repository/publicMembers.ts`（`buildBaseFromWhere`）:

```sql
FROM member_identities mi
  JOIN member_status s ON s.member_id = mi.member_id
  JOIN member_responses r ON r.response_id = mi.current_response_id
 WHERE s.public_consent = 'consented'
   AND s.publish_state = 'public'
   AND s.is_deleted = 0
   AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
```

diagnostics（`apps/api/src/diagnostics/forms-pipeline.ts`）の `visiblePublicCount` はこの境界と整合し、`publishStateBreakdown` / `lastSuccessfulSyncAt` も返す。

### 実行コマンド

```bash
# ローカル回帰（Task A / verify_existing）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build
git diff apps/api/wrangler.toml
rg -n 'MEMBERS_AUTO_PUBLISH_ON_CONSENT' apps/api/wrangler.toml

# runtime ops（user-gated・cf.sh 経由のみ）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging
SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --dry-run
SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --apply
# production は staging evidence + 承認後に同手順（先頭で d1 export backup を取得）
```

### エラーハンドリング / 安全策

- backfill は `dryRun=true` を先に実行し、`candidates` 件数を approval marker に記録した後にのみ `--apply` を実行する。dry-run と apply で件数が大きく乖離する場合は apply を中止しユーザーへエスカレーション（自動 apply しない）。
- production は apply 前に `bash scripts/cf.sh d1 export ubm-hyogo-db-prod` で backup を取得。異常時は `cf.sh rollback <VERSION_ID>` で worker を戻し、誤公開 record は backup 復元または admin UI で `publish_state='hidden'` へ手動再設定。
- evidence JSON / log は保存後に `rg 'SYNC_ADMIN_TOKEN' outputs/phase-11` でゼロ件確認（secret 非混入）。

## 視覚証跡

`/members` の browser smoke screenshot（staging / production の before / after）は **runtime 実行時（user-gated）に取得する**。local 実装検証段階では未取得（`VISUAL_ON_EXECUTION`）。Phase 11 evidence inventory に全 runtime artifact を `pending (Gate-C, user-gated)` で記録済み。

## Known Limits

- flag enablement は将来の sync write のみに効く。既存 record の復旧は backfill apply（user-gated）が必須。
- runtime ops（staging / production deploy・backfill apply・browser smoke）は user-gated であり、本サイクルでは runbook 確定のみ。
