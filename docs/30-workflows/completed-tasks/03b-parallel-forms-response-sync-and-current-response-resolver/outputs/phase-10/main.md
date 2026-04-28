# Phase 10: 完了レポート / Phase 11・12 ハンドオフ

## 完了条件チェック

| 項目 | 状態 |
|------|------|
| Phase 4: テスト戦略・テストマトリクス文書化 | done (`phase-04/`) |
| Phase 5: 実装本体 + 単体テスト + ランブック + 疑似コード | done (`phase-05/`) |
| Phase 6: 失敗系設計 | done (`phase-06/`) |
| Phase 7: AC 充足検証 | done (`phase-07/`、AC 10/10) |
| Phase 8: 並列タスクとの境界整理 | done (`phase-08/`) |
| Phase 9: Free-tier / Secrets / Hygiene | done (`phase-09/`) |
| Phase 10: 完了レポート / ハンドオフ | done (本書) |
| `mise exec -- pnpm typecheck` | green |
| `mise exec -- pnpm vitest run` | 43 files / 324 tests / green |
| commits / PRs を作らない | 守った |
| 変更範囲が `apps/`・`packages/`・本ワークフロー `outputs/` に閉じている | 守った |
| `wrangler` 直接実行をしていない | 守った |

## 実装ファイル一覧（最終）

### 新規

- `apps/api/migrations/0005_response_sync.sql`
- `apps/api/src/jobs/sync-forms-responses.ts`
- `apps/api/src/jobs/sync-forms-responses.test.ts`
- `apps/api/src/jobs/sync-forms-responses.types.test.ts`
- `apps/api/src/jobs/cursor-store.ts`
- `apps/api/src/jobs/__fixtures__/d1-fake.ts`
- `apps/api/src/jobs/mappers/normalize-response.ts`
- `apps/api/src/jobs/mappers/normalize-response.test.ts`
- `apps/api/src/jobs/mappers/extract-consent.ts`
- `apps/api/src/jobs/mappers/extract-consent.test.ts`
- `apps/api/src/routes/admin/responses-sync.ts`
- `apps/api/src/routes/admin/responses-sync.test.ts`

### 改修

- `apps/api/src/index.ts` — `buildFormsClient` + route mount + `*/15 * * * *` cron 分岐
- `apps/api/wrangler.toml` — production / staging crons に `*/15 * * * *` 追加
- `apps/api/src/repository/responseFields.ts` — `upsertKnownField` / `upsertExtraField` 追加
- `packages/integrations/src/index.ts` — `GoogleFormsClient` / `createGoogleFormsClient` 再エクスポート

### ドキュメント（本ワークフロー）

- `docs/30-workflows/03b-.../outputs/phase-04/{main,test-matrix}.md`
- `docs/30-workflows/03b-.../outputs/phase-05/{main,sync-runbook,pseudocode}.md`
- `docs/30-workflows/03b-.../outputs/phase-06/{main,failure-cases}.md`
- `docs/30-workflows/03b-.../outputs/phase-07/{main,ac-matrix}.md`
- `docs/30-workflows/03b-.../outputs/phase-08/main.md`
- `docs/30-workflows/03b-.../outputs/phase-09/{main,free-tier-estimate,secret-hygiene}.md`
- `docs/30-workflows/03b-.../outputs/phase-10/main.md`

## AC 充足

| AC | 状態 |
|----|------|
| AC-1〜AC-10 | すべて green（→ `phase-07/ac-matrix.md`） |

## Phase 11 / 12 ハンドオフ

### Phase 11（PR / Review）でやること
- 本ワークフローの差分を `feat/issue-XXX-03b-forms-response-sync` 等の feature branch に push
- PR description に AC 充足表（`phase-07/ac-matrix.md`）と実装ファイル表（本書）をコピペ
- migration 0005 の rollback コマンドを PR description に明示
- レビュー観点:
  - `runResponseSync` の lock / cursor の冪等性
  - `processResponse` の AC-9 (`is_deleted=1` skip) 経路
  - `normalize-response.ts` の `SYSTEM_STABLE_KEYS` の不変条件 #3 適合
  - `responses-sync.ts` の 401/409/500 マッピング

### Phase 12（Deploy / Verify）でやること
- staging へ migration 適用: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`
- staging へ deploy: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
- admin 経由のスモーク: `curl -X POST $STAGING/admin/sync/responses -H "Authorization: Bearer $TOKEN"`
- `sync_jobs WHERE job_type='response_sync' ORDER BY started_at DESC LIMIT 5` を確認
- `*/15 * * * *` cron が 30 分以内に少なくとも 1 度 succeeded で残ることを確認
- production への昇格は別 PR / 別タスクで判断（01b の web-crypto signer が production secrets と
  接続済みであることが前提）

### 既知の前提（次タスク向け）
- **01b 完了が production deploy の前提**。`apps/api/src/index.ts` の `buildFormsClient` 内
  Workers WebCrypto signer を実装済み。production では Google service account secrets が必要
- **08b の E2E fixture** が完成すれば、本タスクの mock 主体テスト群と統合できる
- **02b の admin merge** が来た時は `EMAIL_CONFLICT` error code を実フローで使う

以上で 03b は実装・検証ともクローズ済み。
