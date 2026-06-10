# dev sync 2nd pass: 1 コミット取込（#1180）で **union 4・`keywords.json` Auto-merge・PR conflict（DIRTY）解消**・`pnpm sync:resolve` 1 パス収束（2026-06-10 `fix/admin-member-detail-500-and-render-loop`）

- 日時: 2026-06-10（同ブランチへの 2 回目 dev 取込）
- ブランチ: `fix/admin-member-detail-500-and-render-loop` ← `origin/dev`（wt-3・初回 sync 後 **1 behind / 4 ahead**）
- 起点: 初回 sync・push 後にユーザー指示「CI が失敗していたら改善、コンフリクトが発生していたら解消」。`gh pr view 1187` が **`mergeable: CONFLICTING` / `mergeStateStatus: DIRTY`** を示し、`git fetch origin dev` で origin/dev が `f0297ad71`(#1180) へ前進していたのが原因と判明（CI チェック自体は HEAD `8c9edc159` で全 pass・失敗 0）。
- 関連: 初回 [[20260610-dev-sync-admin-member-detail-500-behind4-ahead3-union4-keywords-automerge-skillmd-disjoint]] / `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/098/107/116-B**
- 取込: dev 新規 1 コミット = `f0297ad71`(#1180 ホームメンバーカードの情報設計改善とタグ表記明瞭化 0→1)
- 事象: content CONFLICT は **union 4**（`indexes/{quick-reference,resource-map,topic-map}.md` + `references/task-workflow-active.md`）。`keywords.json` / `SKILL-changelog.md` / `SKILL.md` は Auto-merge で非衝突。
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`--diff-filter=U` 0 / マーカー 0。
- **核心データポイント（PR mergeable は CI 成否と独立）**: CI（GitHub Actions の required status check）は HEAD で全 pass でも、base（dev）が後続 commit で前進すると PR は `mergeable: CONFLICTING / DIRTY` になる＝「CI green ≠ merge 可能。push 直後に `gh pr checks` だけでなく `gh pr view --json mergeable,mergeStateStatus` を確認し、CONFLICTING/DIRTY なら `git fetch origin dev` で base 前進を疑い再 sync する」を確定則として再確認。behind 1 の小 delta でも skill index は構造的に union 衝突する（L-DEVSYNC 既知）。
- 検証順: `gh pr checks 1187`（HEAD `8c9edc159` 全 pass・失敗 0）→ `gh pr view 1187 --json mergeable` = CONFLICTING/DIRTY → `git fetch origin dev`（origin/dev = `f0297ad71` へ前進・1 behind / 4 ahead）→ `git merge origin/dev --no-edit` CONFLICT union 4 → `pnpm sync:resolve` → `--diff-filter=U` 0 → merge commit → typecheck/lint/verify-pr-ready 緑 → push。
- 反映先: 本 2nd-pass changelog（**CI green でも base 前進で PR が DIRTY 化する実例＝push 後は mergeable も必ず確認**）+ `task-specification-creator` changelog（同期 wave 共通記録）。新規 lesson 番号は SSOT インフレ回避で起こさず確定データ拡張として記録。
