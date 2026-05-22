# dev sync 後 `pnpm install` が typecheck PASS の前提

- 日時: 2026-05-20
- 文脈: `feat/issue-776-schema-alias-bulk-resolve` ← `dev` sync で `pnpm-lock.yaml` が更新差分に含まれる場合、merge commit 直後の `pnpm typecheck` が `TS2307: Cannot find module 'papaparse'` で fail。
- 原因: lockfile に新規依存（papaparse）が追加されているが `node_modules` 未更新。
- 解消: `pnpm install`（force 不要）で `+2 -126` パッケージ差分が反映され typecheck PASS。
- PR pre-flight への含意: `pr-pre-flight-ci-gate-checklist.md` の dev sync 後の手順に「`pnpm-lock.yaml` の diff が merge に含まれる場合は `pnpm install` を typecheck 前に実行」を明示する。Layer 1 自律修復 §3.2 の発火条件として記録。
- 関連: aiworkflow-requirements/changelog/20260520-dev-sync-issue-776-bulk-resolve-standard-flow.md
