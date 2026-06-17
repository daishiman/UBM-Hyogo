# 20260617 dev sync: admin-dashboard 7th pass — 実マージ CONFLICT 5 / baseline-stale が visual-full と sidebar-shell visual に跨る（task-spec 反映）

- ブランチ: `feat/admin-dashboard-jp-clarity-and-card-ux` ← `origin/dev`（sub-worktree wt-9・behind 2 / ahead 19・merge `3350ad32a`）
- 追加 lesson: [[dev-sync-merge-conflict-resolution]] **SP-DEVSYNC-145**（正本は aiworkflow-requirements L-DEVSYNC-145）

## 仕様書への反映点
- **Phase 5**: 同一ブランチ連続 sync の収束形（no-op / 実マージ）は前 pass に依らず `git rev-list --left-right --count origin/dev...HEAD` で都度再判定する旨をチェックリスト化。CONFLICT 集合は波ごとに反転（前 pass 0 → 今 pass 5）するが resolver-target 内なら集合非依存で `pnpm sync:resolve` 1 パス。
- **🔴Phase 11「CI 失敗解消」節**: baseline-stale 切り分けを `visual-full` job に限定して書かない。changed route（/admin）を撮る全 snapshot job（`visual-full` + sidebar-shell `visual`）が同時 stale fail する一方、その route 非撮影の `visual (chromium, 4 screens)` は green。確定は job 名でなく diff slug 集合（`gh run download --pattern '*<job>*'` → `*-diff.png` slug が changed route のみ）。dev merge 後の機能系 CI green（smoke/auth-slot/e2e×3/coverage-gate）を確認しコード修正対象 0 を確定。baseline 再生成は user-gated（`playwright-visual-baseline-update.yml`）で DoD に含めない。

## 背景
- 前 pass SP-DEVSYNC-143（behind 0・no-op）から数日後、origin/dev が admin-identity-conflicts wave を 2 コミット統合したため実マージに転んだ。CONFLICT 5（keywords `--ours` + union 4）を resolver 1 パス解消。CI 32 pass / 6 fail（全 admin baseline-stale）/ 2 skip。typecheck 7/0・lint 7/0・push pre-push 6 hook pass。コード修正なし。
