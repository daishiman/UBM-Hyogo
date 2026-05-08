# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 名称 | PR 作成 |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

Phase 1-12 の成果物をユーザー承認のもと単一 PR にまとめ、`dev` ブランチへ提出する。

## 前提条件（必須）

- ユーザーから明示的な PR 作成許可を得ていること
- Phase 9 の 9 Gate がすべて PASS
- Phase 11 の動作証跡が採取済み
- Phase 12 の 7 ファイルが実体出力済み
- `git status --porcelain` が空

## 実行順序

### Step 13-1. dev 同期 + マージ

```bash
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout <feature-branch>
git merge dev   # コンフリクト時は CLAUDE.md「PR作成の完全自律フロー」§コンフリクト解消の既定方針 に従う
```

### Step 13-2. 品質検証 3 コマンド

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

失敗時は最大 3 回まで自動修復し、修復差分を別コミットで追加。

### Step 13-3. PR 前 final check

```bash
git status --porcelain   # 空であること
git diff dev...HEAD --name-only   # diff scope が task-09 §3 + workflow dir のみ
ls docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-11/screenshots/ 2>/dev/null
# スクリーンショットあれば PR 本文に参照を入れる
```

### Step 13-4. PR 作成（gh）

```bash
gh pr create --base dev --title "feat(web): Tailwind v4 + OKLch tokens bridge を apps/web に確立 (task-09)" --body "$(cat <<'EOF'
## Summary

- `apps/web` に Tailwind v4 build pipeline を新設（`@tailwindcss/postcss` 単一 plugin）
- OKLch tokens (`--ubm-*` prefix) を `apps/web/src/styles/tokens.css` に正本化し、`globals.css` の `@theme inline` で `--color-*` / `--radius-*` / `--shadow-*` / `--font-*` 名前空間に bridge
- 旧 `apps/web/app/styles.css`（400 行・prototype 写経物）を撤去、layout reset を `@layer base` に移植
- Cloudflare Workers (`@opennextjs/cloudflare`) ビルド + preview 200 を確認

## 変更対象ファイル

- C: `apps/web/postcss.config.mjs`
- C: `apps/web/tailwind.config.ts`
- C: `apps/web/src/styles/tokens.css`
- C: `apps/web/src/styles/globals.css`
- C: `apps/web/src/__tests__/tokens.test.ts`
- C: `apps/web/src/__tests__/build-output.test.ts`
- C: `apps/web/src/__tests__/__fixtures__/utility-probe.tsx`
- M: `apps/web/package.json` (+ `pnpm-lock.yaml`)
- M: `apps/web/app/layout.tsx`
- M: `apps/web/tsconfig.json`
- D: `apps/web/app/styles.css`
- C: `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/**`

## Test plan

- [x] `pnpm --filter @ubm-hyogo/web typecheck` 0 errors
- [x] `pnpm --filter @ubm-hyogo/web test` all pass
- [x] `pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0
- [x] `pnpm --filter @ubm-hyogo/web preview:cloudflare` `/` 200
- [x] HEX 直書き 0 件 grep gate
- [x] `apps/api/**` diff 0

## 既知の一時影響

- `apps/web/app/styles.css` 撤去により、prototype class 依存ページの見た目が一時的に崩れる可能性あり
- task-10 (`ui-primitives`) で primitive 化により解消する想定

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 13-5. 最終レポート

PR URL / 採用ブランチ / 実行した自動修復 / 解消したコンフリクト / 残課題を 1 回だけ報告。

## 禁止事項

- ユーザー明示許可なしの `gh pr create` 実行
- `--no-verify` での commit / push
- main ブランチへの直接 PR（base は `dev`）
- force push

## 完了条件

- [ ] PR が `dev` 宛で作成された
- [ ] 全 Gate が PASS のまま
- [ ] PR URL がユーザーに報告された

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-info.md`
- `outputs/phase-13/pr-creation-result.md`
