# dev sync: cross-skill 6-file conflict も `pnpm sync:resolve` 単一パスで full resolve（2026-05-31 issue-1016）

- 日時: 2026-05-31
- ブランチ: `docs/issue-1016-mobile-drawer-responsive-spec` ← `dev`（9 behind / 3 ahead・ローカル dev は origin/dev に既一致 `bb647c502` で同期は冪等スキップ）
- 関連: `aiworkflow-requirements/changelog/20260531-devsync-issue-1016-cross-skill-6file-conflict-single-resolve-pass.md`、SP-DEVSYNC-076 / L-DEVSYNC-076
- 事象: `git merge dev --no-edit` で `CONFLICT (content)` が **6 件・2 skill 横断**（aiworkflow indexes 4 + `task-workflow-active.md` + 本 skill `references/patterns-lessons-and-pitfalls.md`）。`apps/**`/`packages/**` の source conflict は 0。
- 解消: `pnpm sync:resolve` **1 回**で完結（`union-resolving 5 files` に `patterns-lessons-and-pitfalls.md` を含む → keywords.json `--ours`+`indexes:rebuild`）。`git ls-files -u` 0 で収束。
- 仕様起草への反映（SP-DEVSYNC-076）:
  1. 本 skill `patterns-lessons-and-pitfalls.md` も resolver の UNION_TARGETS。task-spec 側に conflict が出ても手動と誤認せず resolver 直行。
  2. keywords.json は `--ours`+rebuild で処理される。検証手順は「keywords は常に union」前提を置かない。
  3. skill-only なら 6-file / 2-skill 横断でも resolver 単一パス。手動 hybridize は非 skill conflict が出たときのみ。
- 検証: `pnpm sync:resolve` exit 0 → 残 UU 0 → merge commit → `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `pnpm indexes:rebuild` drift 0 で all green。CI failure なし。
