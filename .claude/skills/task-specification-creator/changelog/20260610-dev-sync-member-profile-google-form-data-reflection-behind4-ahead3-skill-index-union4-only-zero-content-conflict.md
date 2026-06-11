# dev sync: 4 コミット取込（behind 4 / ahead 3）で **skill index union 4 件のみ**・実 content conflict 0・CI fail 0（2026-06-10 fix/member-profile-google-form-data-reflection）

> task-specification-creator 側ミラー。正本は aiworkflow-requirements/changelog/同名ファイル。

- 日時: 2026-06-10（`fix/member-profile-google-form-data-reflection` への dev 取込・sub-worktree task-20260609-204017-wt-9）
- ブランチ: `fix/member-profile-google-form-data-reflection` ← `dev`（**4 behind / 3 ahead**・ローカル dev = origin/dev `d0dd40069` で `0/0` 同期済み → ff 不要・dev 独自コミット 0）
- 起点: ユーザー指示「リモート dev をローカル dev にマージ → 本ブランチにマージし conflict・CI fail を解消して push、解消内容を skill へ反映」。スコープ = 現在 WT・現在ブランチのみ（S-SUB 自動確定）。
- 取込: dev 新規 4 コミット = `d0dd40069`(#1186 /admin/schema 目的明確化UI/UX改善) / `2c49dda42`(#1184 タグ定義UI 1画面統合) / `78df4dea0`(#1194 /profile セッション取得失敗 410/5xx/transport 切り分け) / `38f114081`(#1185 開催日ドロワー出席一括追加是正)。
- 事象: `git merge dev --no-edit` で **4 ファイル CONFLICT**（全 aiworkflow-requirements の skill index/reference 系・全 union）= quick-reference.md（手書き）/ resource-map.md（手書き）/ topic-map.md（生成）/ references/task-workflow-active.md → `pnpm sync:resolve` で union-resolve 4 + indexes:rebuild 全自動解消（残 unmerged 0・drift 0）。`apps/web` / `apps/api` content conflict **0 件**。
- 検証順: `git fetch` → behind 4 / ahead 3 → `git merge dev --no-edit` CONFLICT 4 → `pnpm sync:resolve`（手動委譲 0）→ merge commit `25d178114`（lefthook 全 pass）→ `pnpm typecheck` exit 0 / `pnpm lint` exit 0。**CI コード修正なしで全緑**。
- **核心データポイント**: feature 側が `apps/**` 非 touch・skill index/reference のみ touch の場合、衝突は skill index union に限局。前回 profile-session（衝突 2）との差は本タスク skill-sync が **手書き index（quick-reference/resource-map）まで更新済み**ゆえ union 対象が 2 → 4 に拡大した点。手書き index も `pnpm sync:resolve` の union 対象に含まれ自動解消される（[[dev-sync-merge-conflict-resolution]] の確定データ拡張）。
- 反映先: aiworkflow-requirements 正本 changelog + 本ミラー + 両 SKILL-changelog.md 1 行。新規 lesson 番号は起こさず既存則の確定データ拡張として記録。
