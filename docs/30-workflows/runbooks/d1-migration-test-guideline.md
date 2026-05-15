# D1 Migration Test Guideline

## 適用範囲

新規 D1 migration ファイル（`apps/api/migrations/*.sql`）を追加する全 PR、および既存 migration を編集する PR。

## 最低基準

新規 migration を含む PR は、以下 3 項目を満たすこと:

1. **forward apply green**
   - ローカル: `bash scripts/d1/apply-prod.sh <db-name> --env staging --migration <file>` または `wrangler d1 migrations apply <staging-db> --local` で apply を確認
   - CI: `.github/workflows/d1-migration-verify.yml` の staging dry-run / verification step が green
   - `--env preview` は本 repository の `scripts/d1/apply-prod.sh` では未対応のため正本コマンドとして使わない
2. **contract test pass**
   - `apps/api` 配下の既存 contract / route test suite 全 green
   - `pnpm --filter @ubm-hyogo/api test`（または該当 npm script）
3. **repository or use-case test 1 件以上追加**
   - 新規 schema 変更点（追加カラム / 制約 / index）に対する unit / integration test を 1 件以上追加
   - 既存 02b miniflare suite を拡張するのではなく、各タスクで個別の `*.spec.ts` を追加すること

## 02b suite 責任範囲

- 02b の miniflare D1 integration test (`apps/api` 配下) は **initial schema 専用**として固定
- 後続 migration の test は **各 task が個別に追加**する（02b suite を拡張しない）
- 理由: 02b suite を成長させると schema drift 時の責任主体が曖昧になり、レビュー観点が散らばるため

## 適用フロー

PR レビュー時に以下の順序で確認:

1. 新規 / 編集された migration ファイル数を確認
2. `d1-migration-verify` CI の green 確認
3. 新規 test ファイル（`*.spec.ts`）の存在確認
4. rollback 手順の必要性判断（破壊的変更の場合は別 runbook 起票）

## 関連

- UT-04 / 02b initial schema test
- `.github/workflows/d1-migration-verify.yml`
- `docs/30-workflows/completed-tasks/02b-*` の miniflare D1 integration test
