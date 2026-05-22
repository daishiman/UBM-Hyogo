# dev sync: `feat/issue-776-schema-alias-bulk-resolve` ← `dev` 標準フロー成立

- 日時: 2026-05-20
- ブランチ: `feat/issue-776-schema-alias-bulk-resolve` ← `origin/dev` (2a844ec3d)
- 事象: `git merge origin/dev` で 2 件コンフリクト発生
  - `indexes/topic-map.md`（union 対象）
  - `indexes/keywords.json`（derived / `--ours + rebuild` 対象）
- 解消: `pnpm sync:resolve` が両者を自動解消し、`pnpm indexes:rebuild` まで完走（exit 0）。手動介入ゼロ。
- 後続検証: `pnpm install`（papaparse 追加分の反映）→ `pnpm typecheck` PASS → `pnpm lint` PASS。
- 知見: 20260520-dev-sync-resolve-exit1-logs-gitignore.md で記録した exit 1 ケースが解消後、本ケースは `.gitignore (LOGS/)` 競合を含まないため標準フローで完走することを確認。L-DEVSYNC-027 の再現条件「LOGS/_legacy.md に `.gitignore` 競合 hint がある」がない場合は exit 0 となる。
