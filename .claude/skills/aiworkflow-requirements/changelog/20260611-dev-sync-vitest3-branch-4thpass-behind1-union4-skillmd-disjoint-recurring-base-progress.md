# dev sync 4th pass: 1 コミット取込（behind 1 / ahead 8）union 4・**並列 worktree の高頻度 base 進行で同一ブランチが連続 sync-merge する運用パターンを確定**（2026-06-11 chore/vitest-3-upgrade-spec）

- 日時: 2026-06-11（`chore/vitest-3-upgrade-spec` への dev 4th-pass 取込・sub-worktree wt-15・同日 1st〜3rd pass に続き dev が再度 1 コミット進行）
- ブランチ: `chore/vitest-3-upgrade-spec` ← `origin/dev`（**1 behind / 8 ahead**・ローカル dev = origin/dev `ec29ee732` 0/0 同期済み・dev 独自 0）。
- 起点: ユーザー指示（再掲）「CI が失敗している場合は CI を改善・コンフリクトが発生している場合はコンフリクトを改善」。
- 関連: 1st〜3rd pass [[20260611-dev-sync-vitest3-branch-3rdpass-behind1-union4-skillmd-disjoint-mergestate-dirty-from-skill-index]] 系・L-DEVSYNC-130。本回は同型反復の運用パターン確認（新規番号なし）。
- 取込: dev 新規 1 コミット = `ec29ee732`(#1202 監査ログ /admin/audit カード型タイムライン化 + catalog reduce エラー根絶・apps/web 表現層 17 + apps/api 1)。
- 事象: content CONFLICT **4 file**＝`indexes/{quick-reference,resource-map,topic-map}.md` + `references/task-workflow-active.md`（全 union）。`SKILL.md` / `keywords.json` / 両 lessons / 両 SKILL-changelog は Auto-merge。`pnpm sync:resolve`（union 4 + keywords + indexes rebuild）exit 0・`--diff-filter=U` 0。merge `c9effe341`（lefthook 全 pass）。
- **🔴運用パターン確定（L-DEVSYNC-130 反復データ）: 並列 9 worktree で dev が高頻度（同日 4 回）に進行する局面では、同一 feature ブランチが push 後すぐ base 進行で `mergeStateStatus` が DIRTY 化 → 再度 `git merge dev` + `pnpm sync:resolve` を要する。各 pass の conflict は常に skill-index union 4（SKILL.md disjoint）で、取込デルタが apps 表現層/実コードを含んでも gate 入力 touch 0 なら typecheck/lint/frozen-lockfile install の 3 検証で足りる。CI 自体は毎 pass で全 SUCCESS であり、「PR が緑にならない」のは CI fail でなく base 進行追従の遅れが実体。最終 push 直前に `git fetch && git log HEAD..origin/dev` で再進行 0 を確認してから push する（push 直前再進行があれば再度取り込む）**。
- 検証順: `git fetch --prune origin` → `git log HEAD..origin/dev`（#1202 1 件）→ `git -C <main> merge --ff-only origin/dev`（Already up to date）→ `git merge dev --no-edit` CONFLICT 4（skill-index union・SKILL.md disjoint）→ `pnpm sync:resolve` exit 0 → merge `c9effe341` → ahead-range gate 入力 touch 0 → `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / `pnpm install --frozen-lockfile` exit 0（26s）。CI コード修正なしで全緑。
- 反映先: 本 changelog + 両 SKILL-changelog.md 1 行（L-DEVSYNC-130 / SP-DEVSYNC-127 の高頻度 base 進行運用パターンを確認データとして拡張）。
