# dev sync: 3 コミット取込（behind 2 / union 3）— install 要否の決め手は `pnpm-lock.yaml`・`package.json` 単独ヒットは scripts-only 偽陽性（2026-06-17 feat/admin-audit-ux-readability-refine）

- 日時: 2026-06-17（`feat/admin-audit-ux-readability-refine` への dev 取込・sub-worktree wt-13・S-SUB・同ブランチ 3 回目 sync）。
- ブランチ: `feat/admin-audit-ux-readability-refine` ← `dev`（**2 behind / 0 ahead**・ローカル dev = origin/dev `027c43e2c` 0/0 一致・独自 0・ff 不要）。
- 起点: ユーザー指示「リモート dev をローカル dev → 本ブランチへマージし conflict・CI fail を解消して push、解消内容を `task-specification-creator` / `aiworkflow-requirements` skill へ反映」（branch-sync 完全自律実行プロンプト・S-SUB）。
- 取込: #1230(出席ダッシュボード日本語化) / #1231(/admin/identity-conflicts 平易化 + サイドバー改名 + 重複候補 staging seed) / #1235(/admin/requests 承認時 公開状態 diff)。
- 事象: CONFLICT 4 = `indexes/keywords.json`（ours + rebuild）+ `indexes/quick-reference.md` + `indexes/topic-map.md` + `references/task-workflow-active.md`（union 3）。`indexes/resource-map.md` + globals.css + コード群は Auto-merge。`pnpm sync:resolve` 1 パスで収束（marker 0）。
- **🔴新規データ点（SP-DEVSYNC-144: install 要否の決め手は `pnpm-lock.yaml` の有無であって `package.json` の有無ではない）**: #1231 が root + apps/api の `package.json` に `seed:identity-conflicts` / `seed:identity-conflicts:gen` の **scripts 2 行のみ追加**（dependencies 不変）。取込デルタ grep は `package.json` 2 件をヒットさせたが `pnpm-lock.yaml` は不変 → install スキップ。SP-DEVSYNC-142（lock 変更コミット中段埋もれ → install 必須）の対照ケース。
- 仕様書への反映: Phase 5/11 dev sync 節の install 要否判定を「lock 非空 = install 必須 / `package.json` のみヒット = diff 二次判定で scripts-only なら skip」の 2 段に逐語化。SP-DEVSYNC-142 と両立（分岐点は `pnpm-lock.yaml` の 1 点）。
- 検証: `grep -E '(pnpm-lock|package\.json)'` = package.json 2 / lock 0 → `git diff --cached package.json` scripts-only 確認 → install skip → `pnpm typecheck` / `pnpm lint` exit 0 → `pnpm indexes:rebuild` 冪等。CI コード修正 0 で全緑。
- 反映先: 本 changelog + SKILL-changelog.md 1 行 + `lessons-learned/dev-sync-merge-conflict-resolution.md` 新規 **SP-DEVSYNC-144**。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-144 と対。
