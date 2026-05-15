# Phase 13: PR 作成

> **ユーザーの明示承認後のみ実施する。** Phase 12 までの完了が前提。

## 13.1 前提条件チェック

| # | 項目 | 確認方法 |
|---|------|---------|
| P-1 | Phase 1〜12 が `completed`、root は `implemented_local_evidence_captured` または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | `artifacts.json` |
| P-2 | ローカル deterministic verification 全 exit 0 | `outputs/phase-11/manual-smoke-log.md` |
| P-3 | `git status --porcelain` が空（必要な変更は全 commit 済み）| Phase 13 着手直前 |
| P-4 | `git diff dev...HEAD --name-only` で PR 対象が `package.json`, `pnpm-lock.yaml`, `scripts/cf.sh`（任意）, `docs/30-workflows/fix-wrangler-esbuild-import-source-error/**` に限定 | コマンド実行 |

## 13.2 ブランチ運用

| 項目 | 値 |
|------|---|
| base branch | **`dev`**（CLAUDE.md 既定方針） |
| working branch | `fix/wrangler-esbuild-import-source` 推奨 |
| `dev` 同期 | `git fetch origin dev && git merge origin/dev` 後にコンフリクト解消 |
| `main` への直 PR | **禁止**（production リリース時の `dev → main` のみ可） |

## 13.3 PR 作成コマンド

```bash
gh pr create --base dev --title "fix(ci): bump pnpm.overrides.esbuild to support wrangler 4.85.0 import-source flag" --body "$(cat <<'EOF'
## Summary

- `web-cd` / `backend-ci` の `deploy-staging` で発生していた esbuild build error `"import-source" is not a valid feature name for the "supported" setting` を解消する。
- `package.json#pnpm.overrides.esbuild` を wrangler 4.85.0 が要求する `0.27.3` へ bumpし、`@opennextjs/cloudflare@1.19.4` 互換性は `build:cloudflare` で確認する。
- wrangler / OpenNext 本体・CI workflow ファイルは無変更。

## Root cause

wrangler 4.85.0 は内部で esbuild に `supported: { "import-source": ... }` を渡すが、root `pnpm.overrides.esbuild = "0.25.4"` により全 esbuild が 0.25.4 に固定され、当該 feature flag を未認識のため build が失敗していた。

## Changes

- `package.json` — `pnpm.overrides.esbuild` を `0.25.4` → `0.27.3` に更新
- `pnpm-lock.yaml` — esbuild 関連 entry の自動再生成
- `scripts/cf.sh` — 運用根拠コメント追記（任意）
- `docs/30-workflows/fix-wrangler-esbuild-import-source-error/**` — タスク仕様書一式

## Test plan

- [ ] `mise exec -- pnpm install` がローカルで成功
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0
- [ ] `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` が exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` が exit 0
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm test -- --run` 既存件数 pass
- [ ] PR push 後の `web-cd / deploy-staging` job が green
- [ ] PR push 後の `backend-ci / deploy-staging` job が green
- [ ] PR push 後の `runtime-smoke-staging` workflow が green

## References

- 失敗 run: `web-cd #426` / `backend-ci #426`
- Task spec: `docs/30-workflows/fix-wrangler-esbuild-import-source-error/`
EOF
)"
```

## 13.4 自動修復許容範囲（diff-to-pr ポリシー準拠）

PR 作成までに以下が発生した場合のみ自動修復し、それ以外はユーザーに確認する。

| 修復対象 | 許容コマンド |
|---------|-------------|
| lockfile 再生成失敗 | `pnpm install --force` |
| typecheck 失敗（unused import 等明白な型不整合） | 最小差分修正 |
| lint 失敗 | `pnpm lint --fix` |

自動修復は最大 3 回まで。それ以上はユーザー判断を仰ぐ。

## 13.5 最終レポート項目

PR 作成完了後、以下を 1 回だけ報告する:

- PR URL
- 採用ブランチ名
- 確定した esbuild バージョン: `0.27.3`
- 実行した自動修復の有無
- 解消したコンフリクトの有無
- 残課題（Phase 12 unassigned に登録したものがある場合のみ）

## 13.6 DoD

- PR が base=`dev` で作成済み。
- PR description に Phase 12 implementation-guide の Part 2 主要見出しが反映されている。
- CI 上で deploy-staging job が green。
- ユーザーに最終レポート送付済み。
