# dev sync: feat/wt-21 ← dev / 5 件型 UU を `pnpm sync:resolve` 単独で drift ゼロ完結

- 日時: 2026-05-24
- ブランチ: `feat/wt-21` ← `dev`
- 関連: `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` 7 度目の再現
- 衝突: `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md` の 5 件
- 解消フロー:
  1. `pnpm sync:resolve`（4 md = union / `keywords.json` = `--ours + indexes:rebuild`）
  2. `git commit --no-edit`（lefthook pre-commit pass）
  3. `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint`
  4. `bash scripts/verify-pr-ready.sh`（3 gate green、`indexes:rebuild (no drift)` を一発 PASS）
- 学び: 過去 6 例で必要だった「単独 `chore(indexes): rebuild …` コミット」が今回は**不要**。`sync:resolve` 内蔵の `indexes:rebuild` が `task-workflow-active.md` の union 結合行数差分も同一 merge commit に吸収するため、`topic-map.md` の L 番号 drift が残置しない最良ケース。L-DEVSYNC-001 + L-DEVSYNC-002 が安定運用フェーズに到達したことを確認。
