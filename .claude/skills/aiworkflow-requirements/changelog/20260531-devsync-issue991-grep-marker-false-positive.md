# 2026-05-31 dev-sync (issue-991) grep marker 偽陽性の解消知見反映

`feat/issue-991-admin-fetch-error-typed-class` ← `dev`（11 commits 遅れ）の sync-merge を反映。

## Conflict shape

L-DEVSYNC-072 と同型のクリーン基準ケース。conflict は 6 file 全てが skill index/changelog/patterns 系で source code conflict は 0 件:

- `aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}`
- `aiworkflow-requirements/SKILL.md`
- `task-specification-creator/references/patterns-lessons-and-pitfalls.md`

`pnpm sync:resolve` 単独で union-resolve 5 + `keywords.json` `--ours`+rebuild 1 を完結。手動 `--ours`/`--theirs` 判定不要。

## New lesson

新規知見として `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` に **L-DEVSYNC-073** を追加。

resolver 後の念のための残マーカー確認に `git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` を使うと、`docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-11/manual-smoke-log.md` の装飾区切り線（`=` を 60 連で並べた行）が conflict marker 中央線 `=======` に一致して偽陽性化する。これは merge 由来ではなく既存文書のリテラルで `git diff --name-only --diff-filter=U` の対象外。

対策: 解消完了判定は `git ls-files -u`（git index の unmerged stage 直読・装飾線に反応しない）を唯一の正本にする。grep を併用する場合はヒットファイルを `--diff-filter=U` 対象と突き合わせ、対象外は文書リテラルとして無視。除外 path に `completed-tasks/**` の evidence/log/runbook を含める。

task-specification-creator 側は `references/patterns-lessons-and-pitfalls.md` に SP-DEVSYNC-073 として対称汎化。

## Verification

- `pnpm sync:resolve` exit 0 → `git ls-files -u` 0（`git grep '======='` ヒット 1 件は completed-tasks 文書リテラルと確認し無視）
- merge commit `1b662cfad`
- `pnpm typecheck` 6 packages Done
- `pnpm lint` exit 0（`stablekey-literal-lint` の `publicConsent` 2 件は mode=warning の既存・無関係）
- `pnpm indexes:rebuild` 冪等（5212 キーワード・drift 0）

## Boundary

commit / push は user-gated（本反映の実コミットを含む）。
