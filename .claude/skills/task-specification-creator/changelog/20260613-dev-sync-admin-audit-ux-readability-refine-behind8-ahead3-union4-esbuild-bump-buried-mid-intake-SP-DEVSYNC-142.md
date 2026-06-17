# dev sync mirror: 8 コミット取込（behind 8 / ahead 3）union 4 — lock 変更コミット（#1238 esbuild bump）が取込列の中段に埋もれる大型取込（2026-06-13 feat/admin-audit-ux-readability-refine）

- 日時: 2026-06-13（`feat/admin-audit-ux-readability-refine` への dev 取込・sub-worktree wt-13 = `task-20260611-161155-wt-13`・S-SUB）。
- 位置づけ: aiworkflow-requirements `L-DEVSYNC-142` の task-specification-creator skill mirror（仕様書生成手順への逐語化指針）。正本は aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-142 + `changelog/20260613-dev-sync-admin-audit-ux-readability-refine-behind8-ahead3-union4-esbuild-bump-buried-mid-intake-L-DEVSYNC-142.md`。
- ブランチ: `feat/admin-audit-ux-readability-refine` ← `dev`（**8 behind / 3 ahead**・ローカル dev = origin/dev `ea12c1669` 0/0 一致・独自 0）・merge `a3c092b79`。
- 取込: dev 新規 **8 コミット** = tip #1220(タグ定義コード自動生成) / #1221(/admin/schema 日本語化) / **#1238(esbuild 0.27.3→0.28.1・取込列 3 番目)** / #1237 / #1218 / #1213 / #1233 / #1215。
- CONFLICT: aiworkflow skill index **union 4**（quick-reference + resource-map + topic-map + task-workflow-active）のみ・**task-specification-creator 側の衝突 0**・`apps/**` content conflict 0。`pnpm sync:resolve` 1 パス収束・marker 0。
- **🔴新規 SP-DEVSYNC-142（仕様書 Phase 5(c)/Phase 11 への逐語化指針）**:
  1. **install/verify 要否は merge stat で判定**: sync-merge を伴う仕様書の検証手順に「`git show <merge-commit> --stat | grep -E 'pnpm-lock|package.json'` で取込レンジ全体の lock 変更を確認する。tip コミット単体の `git log`/`git show <tip>` で『feature だから lock 変更なし』と短絡しない」と明記。本件 tip #1220 は lock 非接触だが、3 番目の #1238 が esbuild bump で lock を変えていた。
  2. **lock 変更ヒット時は SP-DEVSYNC-140 経路**: lock 差分が `esbuild`/`@esbuild/<platform>` を含むなら `pnpm install --force` → `pnpm verify:vitest-runtime`（arch / worktree-isolation / `host=bin=lock`）後 push。本件 `host=0.28.1 bin=0.28.1 lock=0.28.1 OK`。
  3. **union 件数は behind に非単調**: behind 8 でも union 4 件。Phase 11 リスク欄に「conflict 件数は behind 数に比例しない」と書き先回り予測しない。
- Why: install 要否を「取込デルタ grep」で判定する原則（SP-DEVSYNC-140 / L-DEVSYNC-134-A）は正しいが、その『デルタ』を tip コミット単体と取り違えると誤陰性になり、pre-push `verify-esbuild`（`host≠lock`）で reject される。merge commit の stat は取込レンジ全体の集約差分ゆえ bump コミットが何番目でも確実に捉える。大型取込ほどこの取り違えが起きやすいので仕様書 DoD に組み込む。
- 検証順: `git fetch --prune origin` → dev=origin/dev 0/0（Phase 1 冪等スキップ）→ `git rev-list --count HEAD..origin/dev` = 8 → `git merge dev --no-edit` CONFLICT 4 → `pnpm sync:resolve` exit 0 → marker 0 → merge `a3c092b79`（behind 0）→ **merge stat に pnpm-lock 282 行** → `pnpm install --force` → `pnpm typecheck` 全 package Done / `pnpm lint` exit 0 → `pnpm verify:vitest-runtime`（`host=0.28.1 bin=0.28.1 lock=0.28.1 OK`）→ `pnpm indexes:rebuild` 冪等（5522 kw・porcelain 0）。CI コード修正 0 で全緑。
- 参照: aiworkflow-requirements L-DEVSYNC-142（正本）, SP-DEVSYNC-140（esbuild install・本件はその bump 検出を大型取込向けに精緻化）, SP-DEVSYNC-138（取込デルタ × feature 交差判定）。
