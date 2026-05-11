# Phase 13: PR 作成

[実装区分: 実装仕様書]

## 重要

**PR 作成は user の明示承認後のみ実行する**。本仕様書内の自動実行は禁止。

## 前提

- Phase 1〜12 が `implemented-local` として同期済み
- `pnpm typecheck` / `pnpm lint` / `pnpm verify-design-tokens` / `pnpm test` (targeted) / task-17 Playwright evidence が green
- `apps/api/` 配下の差分が 0 行
- `outputs/phase-12` の strict 7 成果物がすべて存在
- `outputs/phase-11/screenshots/` の 10 screenshot と `phase11-capture-metadata.json` が存在

## PR base (CLAUDE.md "PR作成の完全自律フロー" に従う)

- **base ブランチ: `dev`** (production リリース時のみ `main`)
- 作業ブランチ: 現在の `feat/wt-15` を維持または `feat/admin-schema-conflicts-audit` に rename

## 実行手順 (user 承認後)

```bash
git fetch origin dev
git checkout dev && git pull --ff-only
git checkout feat/wt-15  # or task branch
git merge dev
# conflict は CLAUDE.md「コンフリクト解消の既定方針」に従う

# 品質検証 (3 コマンド)
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# git diff dev...HEAD --name-only で変更ファイル一覧確認
git status --porcelain  # 残り変更が無いこと

gh pr create --base dev --title "feat(web/admin): implement schema/identity-conflicts/audit screens (task-17)" --body "$(cat <<'EOF'
## Summary

- `/admin/schema` — Google Form schema diff + stableKey inline assignment form
- `/admin/identity-conflicts` — 候補ペア compare + inline merge/dismiss confirmation
- `/admin/audit` — FilterBar + table + masked JSON disclosure + cursor pagination
- 既存 `apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` を adapter 経由で接続 (apps/api 差分 0)

## Test plan

- [ ] `pnpm typecheck` / `pnpm lint` green
- [ ] `pnpm verify-design-tokens` green (HEX 直書き 0)
- [ ] vitest (11 file targeted) all green
- [ ] jest-axe critical violations 0
- [ ] `PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit pnpm -F @ubm-hyogo/web exec playwright test playwright/tests/admin-schema-conflicts-audit.spec.ts --project=desktop-chromium` green
- [ ] dev server で 3 route が SSR 200 (`/admin/schema`, `/admin/identity-conflicts`, `/admin/audit`)
- [ ] apply / merge / dismiss が inline confirmation/form 経由で動作
- [ ] audit FilterBar が URL searchParams と双方向同期
- [ ] cursor pagination で次ページ取得

## Screenshots

`docs/30-workflows/task-17-admin-schema-conflicts-audit/outputs/phase-11/screenshots/` の 10 枚を参照。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## PR 本文の必須項目

- Phase 12 `implementation-guide.md` の Part 1 / Part 2 主要見出しを反映
- `outputs/phase-11/screenshots/*.png` を参照 (10 枚)
- スクリーンショットがない場合は section を作らない (CLAUDE.md ルール)

## DoD

- [ ] user の明示承認を取得
- [ ] base=dev で PR が作成された
- [ ] PR 本文に test plan + screenshot 参照
- [ ] artifacts.json の `phase13` を `completed` に更新
