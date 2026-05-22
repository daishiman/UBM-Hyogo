# Phase 10: 運用ランブック

[実装区分: 実装仕様書]

## 1. local stack トラブルシューティング

### 1.1 `apps/api` 起動失敗（D1 binding error）

```bash
bash scripts/cf.sh d1 list                              # local DB 一覧
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-local --local
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-local --local
```

### 1.2 `/admin/schema/diff` が空

```bash
# seed 投入確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local \
  --command "SELECT id, stable_key FROM schema_fields WHERE id LIKE 'seed-%';"
# 0 行なら seed-diff.sql を再投入
```

実 schema 名が `schema_fields` でない場合は `apps/api/migrations/**` を確認し、SQL を実 schema に合わせて microadjust する（実装側を変えない）。

### 1.3 Auth.js gate redirect ループ

- storageState 期限切れ → Phase 4 Step 6 を再実行（Magic Link 再ログイン）
- cookie domain が `localhost` 以外 → DevTools で domain 確認、`apps/web/playwright/.auth/admin.json` の `domain` 値を修正
- `next-auth.session-token` 以外の cookie 名（`__Secure-` prefix 等）が production と異なる場合は local cookie 名を確認

### 1.4 Playwright が dev server を起動できない

```bash
# 既存 dev server を確認
lsof -i :3000
# 既に起動中なら config の reuseExistingServer を有効化、または kill して再実行
```

## 2. Cloudflare CLI 経由ルール

- `wrangler` 直叩き禁止。すべて `bash scripts/cf.sh ...` 経由
- API Token 値・OAuth token 値はログ / 本ドキュメント / コミット message に転記禁止
- `.env` 実値の cat / Read / grep 禁止（CLAUDE.md「ローカル `.env` の運用ルール」）

## 3. staging fallback（local 取得が困難な場合）

local で D1 / Auth.js / dev server の三点同時起動が困難な場合の代替経路:

```bash
# staging deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# staging URL に対して spec を実行
ADMIN_SCHEMA_DIFF_BASE_URL=https://<staging-url> \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --config=playwright.admin-schema-diff.config.ts
```

注意:
- staging への deploy は **ユーザー明示承認後のみ** 実行（governance mutation 扱い）
- staging admin session も同テストアカウントで取得し cookie 揮発的に扱う
- staging 用 storageState は `apps/web/playwright/.auth/admin-staging.json` に分離（`.gitignore` で除外）

## 4. 後続再利用

本 runbook は serial-05 step-04 / step-05 の runtime evidence でも再利用可能。違いは以下のみ:
- seed SQL の対象 entity が変わる
- screenshot ファイル名が変わる
- spec の selector が変わる

step-04 / step-05 で再利用する場合は本 spec を雛形にコピーし、上記 3 点を差し替える。

## 5. 既存 ENOSPC リカバリ (parallel-09 から横展開)

Playwright cache / disk space リカバリ手順は `docs/30-workflows/completed-tasks/issue-746-parallel-09-playwright-visual-evidence-completion/phase-10-operational-runbook.md` を参照。
