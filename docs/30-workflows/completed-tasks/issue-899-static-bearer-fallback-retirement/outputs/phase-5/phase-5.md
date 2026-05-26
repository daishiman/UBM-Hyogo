# Phase 5 — 実装手順

> 本 phase は実装手順の仕様化であり、`.github/workflows/runtime-smoke-staging.yml` 等の実装編集は #916 完了後の user-gated 実装 PR で実行する。仕様書作成 wave で実コード実装済みとは扱わない。

> 本仕様書 PR では実装しない。実装 PR（前提 #916 完了後）で以下の順序で実行する。

## 1. ブランチ作成

```bash
git fetch origin dev
git checkout -b feat/issue-899-retire-static-bearer-fallback origin/dev
```

## 2. workflow edit（`.github/workflows/runtime-smoke-staging.yml`）

### 2-1. job.env 削除（`:29` / `:31` / `:32-33` / `:35-37`）

phase-2 § 1-1 の After ブロックへ置換。

### 2-2. mint step 修正（`:44-71`）

- `:47` `if: env.STAGING_AUTH_SECRET != ''` 行を削除
- `:51` `run: |` 直後に fail-fast guard を挿入:

```bash
if [ -z "${STAGING_AUTH_SECRET:-}" ]; then
  echo "::error::STAGING_AUTH_SECRET is required for mint-only runtime smoke (issue #899 retired static fallback). Provision via 'gh secret set STAGING_AUTH_SECRET --env staging-runtime-smoke'."
  exit 1
fi
```

- それ以降の `mint_out=` 以下は変更しない

### 2-3. mask staging credentials step 簡素化（`:88-99`）

phase-2 § 1-3 の After ブロックへ置換（`if`-`else` ブロックを 1 行 notice に縮約）。

### 2-4. freshness step コメント更新（`:101-104`）

run コマンドは変更せず、上部コメント 2 行を phase-2 § 1-5 の After に置換。

## 3. runbook edit（`docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`）

```bash
# (a) 既存 section 削除
#     "### 後方互換 fallback を残す理由"
#     "### 即時運用復旧（mint 導入前に今すぐ緑にしたい場合）"
# (b) phase-2 § 2-2 の新 section を追加
# (c) 冒頭サマリーに minted-only 運用記述を追記
```

## 4. SSOT edit（`docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`）

§6 恒久化導線の「fallback 撤去（#899）」状態行を:

```markdown
- fallback 撤去（#899）: **完了済み**（実装 PR #<assigned-pr-number> merged 2026-MM-DD）
```

へ更新。PR 番号と日付は実装 PR 確定後に sed で置換。

## 5. local 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml

# grep gate（全て 0 件期待）
grep -n 'static-fallback' .github/workflows/runtime-smoke-staging.yml
grep -nE 'if:[[:space:]]+env\.STAGING_AUTH_SECRET' .github/workflows/runtime-smoke-staging.yml
grep -n 'RUNTIME_SMOKE_FRESHNESS_ENFORCE' .github/workflows/runtime-smoke-staging.yml
grep -nE '^\s+STAGING_ADMIN_BEARER:[[:space:]]*\$\{\{' .github/workflows/runtime-smoke-staging.yml
grep -nE '^\s+STAGING_ME_BEARER:[[:space:]]*\$\{\{' .github/workflows/runtime-smoke-staging.yml
grep -n 'static-fallback\|後方互換 fallback\|即時運用復旧' docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md
```

## 6. commit / push / PR（user-gated）

```bash
git add .github/workflows/runtime-smoke-staging.yml \
        docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md \
        docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md
git commit -m "refactor(ci): retire static bearer fallback in runtime-smoke-staging (Refs #899)"
git push -u origin feat/issue-899-retire-static-bearer-fallback
gh pr create --base dev --title "refactor(ci): retire static bearer fallback (#899)" --body-file <pr-body>
```

## 7. merge 後（user-gated）

```bash
# (a) mint-only smoke 緑確認
gh workflow run runtime-smoke-staging.yml --ref dev

# (b) auth path = minted 確認
gh run view <id> --log | grep 'runtime-smoke auth path'

# (c) physical secret 削除
gh secret delete STAGING_ADMIN_BEARER --env staging-runtime-smoke
gh secret delete STAGING_ME_BEARER --env staging-runtime-smoke

# (d) 削除後 smoke 再確認
gh workflow run runtime-smoke-staging.yml --ref dev
```
