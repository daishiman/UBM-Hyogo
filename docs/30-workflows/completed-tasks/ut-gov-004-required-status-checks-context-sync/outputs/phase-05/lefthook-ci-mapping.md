# lefthook-ci-mapping.md — Phase 5 確定対応表

## 1. 現状 hook と CI の対応

| lefthook hook / command | run | 対応 CI context |
| --- | --- | --- |
| pre-commit / main-branch-guard | `bash scripts/hooks/main-branch-guard.sh` | n/a（ローカル専用） |
| pre-commit / staged-task-dir-guard | `bash scripts/hooks/staged-task-dir-guard.sh` | n/a |
| post-merge / stale-worktree-notice | `bash scripts/hooks/stale-worktree-notice.sh post-merge` | n/a |

## 2. CI 実行スクリプトと pnpm script の整合

| CI workflow / job | CI 内 run | package.json script | 一致 |
| --- | --- | --- | --- |
| `ci` (Type check) | `pnpm typecheck` | `"typecheck": "pnpm -r typecheck"` | ✅ |
| `ci` (Lint) | `pnpm lint` | `"lint": "node scripts/lint-boundaries.mjs && pnpm -r lint"` | ✅ |
| `Validate Build` (Build) | `pnpm build` | `"build": "bash scripts/with-env.sh pnpm -r build"` | ✅ |
| `verify-indexes-up-to-date` (Rebuild indexes) | `pnpm indexes:rebuild` | `"indexes:rebuild": "node .claude/skills/aiworkflow-requirements/scripts/generate-index.js"` | ✅ |

## 3. 推奨追加 hook（任意）

将来的に pre-push hook を追加する場合の推奨設定:

```yaml
pre-push:
  parallel: true
  commands:
    typecheck:
      run: pnpm typecheck
    lint:
      run: pnpm lint
    build:
      run: pnpm build
    indexes-drift:
      run: pnpm indexes:rebuild && git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes
```

これにより CI と同じ pnpm script を pre-push で先行実行できる。配置は `task-git-hooks-lefthook-and-post-merge` の責務。

## 4. 同一 pnpm script 共有規約（再掲）

- lefthook の `run:` と `.github/workflows/*.yml` の `run:` は同一 pnpm script を呼ぶ
- コマンド本体を YAML にインライン記述しない
- 例外: `actions/*` 等の uses 系ステップ、認証系（`bash scripts/cf.sh` 経由）

## 5. ドリフト監視

- 月 1 回 `pnpm install --frozen-lockfile` 後の lefthook PASS と CI PASS の差分を確認
- 差分発生時は `[ci-hook-drift-fix]` PR で同一 PR 修正
