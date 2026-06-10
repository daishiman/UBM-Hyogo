# dev sync 2nd pass: 1 コミット取込（#1180）で union 4・`keywords.json` Auto-merge・**CI green でも base 前進で PR が DIRTY 化した実例**・`pnpm sync:resolve` 1 パス収束（2026-06-10 admin-member-detail-500）

- 日時: 2026-06-10（同ブランチへの 2 回目 dev 取込）
- ブランチ: `fix/admin-member-detail-500-and-render-loop` ← `origin/dev`（wt-3・初回 sync 後 **1 behind / 4 ahead**）
- 関連: 初回 [[20260610-dev-sync-admin-member-detail-500-behind4-ahead3-union4-keywords-automerge-skillmd-disjoint]] / `aiworkflow-requirements/changelog/20260610-dev-sync-admin-member-detail-500-2ndpass-1180-behind1-union4-keywords-automerge` / `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/098/107/116-B** / SP-DEVSYNC-089/098
- 取込: dev 新規 1 コミット = `f0297ad71`(#1180 ホームメンバーカード情報設計改善 + タグ表記明瞭化 0→1)
- 事象: content CONFLICT は **union 4**（`indexes/{quick-reference,resource-map,topic-map}.md` + `references/task-workflow-active.md`）。`keywords.json` / `SKILL.md`（両スキル）は Auto-merge 非衝突。
- 解消: `pnpm sync:resolve` 1 回（`union-resolving 4 files` + `indexes:rebuild`）。`--diff-filter=U` 0 / マーカー 0。
- **Phase 11/12 sync-merge 節への補強（merge 可否は CI 成否と独立に判定すべき）**: 初回 sync・push 後、CI（required status check）は HEAD `8c9edc159` で **全 pass・失敗 0** だったが、base の dev が `f0297ad71`(#1180) で前進したため PR #1187 は `mergeable: CONFLICTING / mergeStateStatus: DIRTY` 化していた。教訓「タスク完了判定で `gh pr checks` の pass だけを見て終えると base 前進由来の DIRTY を見落とす。push 直後は必ず `gh pr view --json mergeable,mergeStateStatus` を併読し、CONFLICTING/DIRTY なら `git fetch origin dev` → 再 sync する」を SP-DEVSYNC-089/098 の補強として追記。本解消も標準 sync-merge union 機構へ全回収され spec 生成手順（Phase 1-13 / 単一責務分解 / Phase 12 中学生レベル説明）への影響 0。
- 検証順: `gh pr checks 1187`（HEAD 全 pass）→ `gh pr view 1187 --json mergeable` = CONFLICTING/DIRTY → `git fetch origin dev`（origin/dev 前進・1 behind / 4 ahead）→ `git merge origin/dev --no-edit` CONFLICT union 4 → `pnpm sync:resolve` → `--diff-filter=U` 0 → merge commit → `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` 緑 → push。
