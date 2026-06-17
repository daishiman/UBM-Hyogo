# 20260617 dev sync: admin-dashboard 7th pass — 実マージ CONFLICT 5 / baseline-stale が visual-full と sidebar-shell visual に跨る

- ブランチ: `feat/admin-dashboard-jp-clarity-and-card-ux` ← `origin/dev`（sub-worktree wt-9・behind 2 / ahead 19・merge `3350ad32a`）
- 追加 lesson: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] **L-DEVSYNC-145**（task-spec 版 SP-DEVSYNC-145）

## 要点
- 前 pass L-DEVSYNC-143（2026-06-14・behind 0 で no-op `Already up to date`）の数日後の再 sync。間に origin/dev が admin-identity-conflicts wave を 2 コミット統合（`f61b8e43`）したため、**同一ブランチでも今回は実マージ**に転んだ（`git rev-list --left-right --count origin/dev...HEAD` = `2	19`）。
- CONFLICT 5 = `indexes/keywords.json`（`--ours`）+ `indexes/quick-reference.md` + `indexes/resource-map.md` + `indexes/topic-map.md` + `references/task-workflow-active.md`（union 4）。`pnpm sync:resolve` 1 パスで収束（残 U 0・marker 0）。dev 由来 identity-conflicts 実コード・visual baseline PNG は content conflict 0 で auto-merge。
- CI: **32 pass / 6 fail / 2 skip**。fail 6 は全て `admin` 画面のみの baseline-stale = `visual-full` ×3 + `playwright-smoke.yml` の sidebar-shell `visual` ×3。`visual (chromium, 4 screens)`（/admin 非撮影）・`smoke`・`auth-slot`・`e2e ×3`・`coverage-gate` は全 green。

## 知見（L-DEVSYNC-145）
- **A**: 同一ブランチ連続 sync の収束形（no-op / 実マージ）は前 pass に依らず都度 `git rev-list --left-right --count origin/dev...HEAD` で再判定する。前 pass の no-op を今 pass の予測に流用しない。
- **🔴B**: baseline-stale 切り分け（L-DEVSYNC-143-C/144-A）の対象は `visual-full` に限らない。changed route（/admin）を撮る全 snapshot job が同一 stale fail する。確定は job 名でなく **diff artifact の slug 集合**（`gh run download` → `*-diff.png` slug が全て changed route のみ）で行う。/admin 非撮影 job の green が独立裏取り。
- **C**: dev merge 後も自ブランチ過去 CI fix（`469c47c29` の axe listitem / e2e spec drift）が維持され dev 新規 e2e spec も pass → コード修正対象 0・fail 全件 baseline-stale。baseline 再生成は `playwright-visual-baseline-update.yml` の user-gated workflow ゆえ sync DoD に含めない。

## 検証
- `pnpm sync:resolve` exit 0 → `git commit`（merge `3350ad32a`・pre-commit 4 hook pass）→ install skip（lock 変更なし）→ `pnpm typecheck` 7/0 / `pnpm lint` 7/0 → `git push`（pre-push 6 hook pass）→ `gh pr checks 1222` 32/6/2。fail 6 の diff slug 全 vp `admin` のみ確認・`gh run list --branch dev` で smoke/visual-full が dev HEAD `71a0d46cb` success。コード修正なし。
