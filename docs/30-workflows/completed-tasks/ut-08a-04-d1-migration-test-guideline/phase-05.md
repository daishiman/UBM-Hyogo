# Phase 5: runbook 作成（実装手順）

## 実装ステップ

### Step 1: runbook 新規作成

ファイル: `docs/30-workflows/runbooks/d1-migration-test-guideline.md`

```markdown
# D1 Migration Test Guideline

## 適用範囲

新規 D1 migration ファイル（`apps/api/migrations/*.sql`）を追加する全 PR、および既存 migration を編集する PR。

## 最低基準

新規 migration を含む PR は、以下 3 項目を満たすこと:

1. **forward apply green**
   - ローカル: migration ごとの task で `wrangler d1 migrations apply <staging-db> --local` または `bash scripts/d1/apply-prod.sh --env staging --migration <file>` のように実在 script / wrangler 直実行を明記する
   - CI: `.github/workflows/d1-migration-verify.yml` の staging dry-run / verification step が green
   - `--env preview` はこの repository の `scripts/d1/apply-prod.sh` では未対応のため正本コマンドとして使わない
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
```

### Step 2: `apps/api/migrations/README.md` 追加 / 編集

ファイル: `apps/api/migrations/README.md`

既存ファイルが存在する場合は冒頭に以下セクションを追加。存在しない場合は新規作成:

```markdown
# apps/api/migrations

D1 schema migrations. すべての新規 / 編集 PR は以下ガイドラインに従うこと。

📌 **[D1 Migration Test Guideline](../../../docs/30-workflows/runbooks/d1-migration-test-guideline.md)** — 最低基準 3 項目 / 02b 責任範囲 / 適用フロー
```

### Step 3: CI workflow に comment step 追加

ファイル: `.github/workflows/d1-migration-verify.yml`

permissions 拡張:

```yaml
    permissions:
      contents: read
      pull-requests: write
```

job 末尾に Step（Phase 2 で記載した `actions/github-script@v7` step）を追加。必ず `if: always() && github.event_name == 'pull_request'` と `continue-on-error: true` を付け、前段 verify 結果から runbook link comment を独立させる。

### Step 4: bats test 追加

ファイル: `scripts/d1/__tests__/migration-guideline-presence.bats`

Phase 2 で記載した 5 ケース（file presence + 3 見出し + 最低基準 3 語句）を追加。

## 実行コマンド

```bash
# bats test 実行
bats scripts/d1/__tests__/migration-guideline-presence.bats

# 既存全体 bats 回帰
bats scripts/d1/__tests__/*.bats

# YAML lint（actionlint がローカルにある場合）
actionlint .github/workflows/d1-migration-verify.yml
```

`actionlint` がローカルに無い場合は `runtime_pending (tool unavailable)` として Phase 11 evidence に理由を記録し、CI の actionlint / workflow validation で確認する。lint 失敗を `|| true` で握りつぶさない。

## DoD（Definition of Done）

- 4 ファイル（runbook / README / yml / bats）の変更が反映されている
- `bats scripts/d1/__tests__/migration-guideline-presence.bats` が全 5 ケース pass
- `bats scripts/d1/__tests__/*.bats` の既存ケースが回帰なく pass
- runbook が他文書から相対パスで参照可能（broken link なし）

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 5 |
| status | completed |

## 目的

Phase 2 設計を実ファイルへ反映する具体手順を固定する。

## 実行タスク

- runbook / README / workflow / bats test を作成または更新する。
- 実在コマンドと repository path に合わせて手順を記述する。

## 参照資料

- `phase-02.md`
- `scripts/d1/apply-prod.sh`
- `.github/workflows/d1-migration-verify.yml`

## 成果物/実行手順

このファイルの Step 1-4 を順番に実行し、Phase 9 コマンドで検証する。

## 完了条件

- DoD の4項目がすべて満たされている。

## 統合テスト連携

`bats scripts/d1/__tests__/migration-guideline-presence.bats` と全体 bats 回帰へ接続する。
