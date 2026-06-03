# dev sync: union member 集合の振動（SKILL.md+topic-map / task-workflow-active auto-merge）を `pnpm sync:resolve` 単独完結で回帰確認（2026-06-03）

- 日時: 2026-06-03
- ブランチ: `feat/issue-1069-tag-code-rename` ← `dev`（5 behind / 2 ahead、ローカル dev = origin/dev 済で dev 同期は no-op）
- 関連: `lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-085 / aiworkflow-requirements `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-093
- 事象: `git merge dev` の content CONFLICT は **3 file**＝`aiworkflow-requirements/SKILL.md` + `indexes/keywords.json` + `indexes/topic-map.md`。`references/task-workflow-active.md` は今回 git auto-merge（SP-DEVSYNC-085 の union 5 files = SKILL.md と task-workflow-active 同時衝突とは**逆振動**）。apps/** はコード衝突ゼロ（NON_VISUAL apps/api 限定 feature ゆえ）。
- 解消: `pnpm sync:resolve` 1 回で union-resolving 2 files（SKILL.md + topic-map.md）+ keywords `--ours` + 内部 `pnpm indexes:rebuild` で exit 0、`git diff --diff-filter=U` 0、手動解消ゼロ。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **union member 集合は予測子にしない（SP-DEVSYNC-085 #2 の回帰確認）**: 集合は branch ごとに `{topic-map, task-workflow-active}`／`{SKILL.md, map3, task-workflow-active}`／`{SKILL.md, topic-map}`(本件) と振動するが、全 member が union 登録済みなので件数・構成に依らず resolver が 1 パスで畳む。毎回 `git diff --name-only --diff-filter=U` で実集合を確定し resolver に委ねる。
  2. **dev 同期が no-op（ローカル dev = origin/dev）でも sync:resolve フローは不変**: 本件はローカル dev が既に origin/dev と一致（`merge --ff-only` が `Already up to date.`）で dev 同期はスキップされたが、feature への dev 取込側で skill-index 衝突は通常通り発生し resolver で完結する。dev 同期の no-op は feature 側衝突の有無と独立。
- 適用範囲外: apps/docs にコード本体 / rename が混在し resolver が exit 1 + WARN を出す回（SP-DEVSYNC-053/084 経路）。本件は skill-index 限定 exit 0 完結の基準形（SP-DEVSYNC-083/085）の追確認データポイント。
- 検証: `git merge dev` CONFLICT 3 → `pnpm sync:resolve` exit 0（union 2 + keywords `--ours` + rebuild・unhandled WARN なし）→ `git ls-files -u` 0 → merge commit `2e86eec31` → `pnpm typecheck` 全 package Done → `pnpm lint` exit 0 → `pnpm indexes:rebuild` drift 0（5375 キーワード）。CI コード修正なしで全緑。
- 追補（同日 2 回目 sync・origin/dev が `8a0db76f0`→`2a56eb5d9` へ 1 進行後）: 同ブランチ再 merge（1 behind / 4 ahead）で content CONFLICT は **2 file**（SKILL.md + topic-map.md）、**keywords.json は今回 auto-merge 側へ振動**（前回 `--ours`）。`pnpm sync:resolve` exit 0 / `git ls-files -u` 0 / merge commit `902218d89` / typecheck・lint・indexes drift 0 で全緑。派生物（keywords/topic-map/quick-reference）のどれが衝突するかも回ごとに変わり、resolver が `--ours`/union/auto-merge を自動判別する点を追確認（How to apply #1 の補強データ）。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-093, SP-DEVSYNC-083（基準形）, SP-DEVSYNC-085（逆振動 union 5 files の member 構成）。
