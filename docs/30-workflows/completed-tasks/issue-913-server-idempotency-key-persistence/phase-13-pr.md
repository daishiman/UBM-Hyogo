# Phase 13: PR 作成

> Refs #913
> 前提: Phase 12 DoD 全達成、Gate-B 通過済。本フェーズの commit / push / PR / migration apply / deploy は **Gate-C ユーザー明示承認後にのみ** 実行する。

## Gate-C ユーザー明示承認 marker

PR 作成および不可逆 mutation の実行前に、ユーザーから明示的な承認を得たことを示す marker ファイルを作成する。

### marker ファイル

```
outputs/phase-13/user-approval-issue-913-<timestamp>.md
```

`<timestamp>` は `YYYYMMDD-HHmmss`（JST）。例: `outputs/phase-13/user-approval-issue-913-20260525-1900.md`。

### marker 内容テンプレ

```markdown
# Gate-C ユーザー承認 — issue-913

- 承認者: daishiman
- 承認日時: <timestamp>
- 対象 PR base: dev
- 承認スコープ:
  - [ ] commit（範囲: 下記「コミット範囲」のとおり）
  - [ ] push（current feature branch → origin）
  - [ ] PR 作成（`gh pr create --base dev`）
  - [ ] staging migration apply（`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging`）
  - [ ] staging deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`）
- production への適用は本 marker のスコープ外（別 manual op で別途承認）
- 事前 read-only evidence: `outputs/phase-11/migrations-list-before.txt`（取得済 / 未取得）
- 事前バックアップ: `outputs/phase-11/backup-before-0021.sql`（取得済 / 未取得 — production 適用時必須）
```

PR description にこの marker ファイルへの相対パスを引用する。

## コミット範囲

以下のパスのみを `git add` する（`git add -A` は使わず明示）:

| パス | 種別 |
|---|---|
| `apps/api/migrations/0021_idempotency_keys.sql` | 新規 |
| `apps/api/src/middleware/idempotency.ts` | 新規 |
| `apps/api/src/middleware/idempotency/fingerprint.ts` | 新規（Phase 8 リファクタ後） |
| `apps/api/src/middleware/idempotency/body.ts` | 新規（同上） |
| `apps/api/src/middleware/idempotency/scope.ts` | 新規（同上） |
| `apps/api/src/repository/idempotency.repository.ts` | 新規 |
| `apps/api/src/routes/admin/_shared.ts` | 編集（middleware 配線追加） |
| `apps/api/src/middleware/__tests__/idempotency.spec.ts` | 新規 |
| `apps/api/src/repository/__tests__/idempotency.repository.spec.ts` | 新規 |
| `docs/30-workflows/issue-913-server-idempotency-key-persistence/**` | workflow docs 一式 |
| `.claude/skills/aiworkflow-requirements/**`（Step 1-A/1-B 差分のみ） | 反映分 |
| `.claude/skills/task-specification-creator/references/patterns-lessons.md` | Step 1-C 反映分 |

機密ファイル（`.env` / `*.toml` の credential 系）は混入していないことを `git diff --cached --name-only` で確認する。

## push / PR 作成手順

### Step 1: branch sync（dev 取り込み）

```bash
git fetch origin dev
git merge origin/dev
# conflict が出たら CLAUDE.md「sync-merge コンフリクト解消の3層予防」に従い pnpm sync:resolve を先に試す
```

### Step 2: pre-flight gate

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

全 exit 0 を確認。失敗時は CLAUDE.md「品質検証失敗時の自動修復」に従い最大 3 回まで修復後、修復差分をコミット。

### Step 3: push

```bash
git push -u origin <current-branch>
```

### Step 4: PR 作成

```bash
gh pr create --base dev --title "feat(issue-913): server-side Idempotency-Key persistence for admin mutations" --body "$(cat <<'EOF'
Refs #913

## Summary
- admin mutation endpoint で `Idempotency-Key` HTTP header を受け取り、D1 永続化された dedupe ストアで「同一 key の重複リクエストを初回処理 + 結果再生で冪等化する」server-side idempotency 基盤を整備
- 親 issue-842 で明示的にスコープ外とされた server 側 gap の解消（client 側は親 issue で完了済のため変更なし）
- handler shape 不変。Hono middleware として admin scope 横断適用

## Changes
- `apps/api/migrations/0021_idempotency_keys.sql`: `idempotency_keys` テーブル + UNIQUE INDEX(key, method, path) + INDEX(expires_at)
- `apps/api/src/middleware/idempotency.ts`（+ サブヘルパー 3 ファイル）: header 検出 → in_flight INSERT → handler → 結果保存 / 再生 / 409 / 422 / 5xx rollback
- `apps/api/src/repository/idempotency.repository.ts`: `c.env.DB` 経由 CRUD + lazy GC
- `apps/api/src/routes/admin/_shared.ts`: middleware 配線（`app.use("*", idempotency)`）
- contract.spec / repository.spec 追加

## Test plan
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api lint`
- [x] `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/middleware/__tests__/idempotency.spec.ts`
- [x] `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/idempotency.repository.spec.ts`
- [x] `mise exec -- pnpm build`
- [x] Phase 11 staging 適用 + 同一 key 再生 / 並行 409 確認（evidence は `outputs/phase-11/`）

## Approval gate
- Gate-A: PASSED（Phase 3 設計レビュー）
- Gate-B: PASSED（Phase 9 / Phase 10）
- Gate-C: ユーザー明示承認済（`docs/30-workflows/issue-913-server-idempotency-key-persistence/outputs/phase-13/user-approval-issue-913-<timestamp>.md`）

## Irreversible mutation 警告
- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging|production` および `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging|production` は不可逆
- production 適用は本 PR の merge 後、別 manual op として切り分け（本 PR スコープ外）
- 事前バックアップ: `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output outputs/phase-11/backup-before-0021.sql`
EOF
)"
```

## production deploy の切り分け

production への `d1 migrations apply` および `deploy` は **本 PR の merge 後**、以下の別 manual op として切り分ける（本 PR スコープ外）:

1. `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-before-0021.sql`（事前バックアップ）
2. `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production`（read-only 確認）
3. ユーザー明示承認（production 用 Gate-C marker を別途作成）
4. `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
5. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`
6. production 上で同一 key 再生確認（Phase 11 Step 3 と同等を production endpoint に対して実施）

## 終了条件

- Gate-C marker ファイル作成済
- 4 commands（typecheck / lint / verify-pr-ready / build）全 PASS
- PR URL 取得済（`outputs/phase-13/pr-creation-result.md` に保存）
- Gate-C `status` / `passed_at` は PR 承認後のみ更新
