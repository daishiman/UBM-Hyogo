# dev sync: 5 コミット取込（behind 5 / ahead 2）で **skill index union 2 件のみ**・実 content conflict 0・CI fail 0（2026-06-10 feat/profile-session-fetch-failure-investigation）

- 日時: 2026-06-10（`feat/profile-session-fetch-failure-investigation` への dev 取込・sub-worktree task-20260609-162625-wt-6）
- ブランチ: `feat/profile-session-fetch-failure-investigation` ← `dev`（**5 behind / 2 ahead**・ローカル dev = origin/dev `38f114081` で `0/0` 同期済み → ff 不要・dev 独自コミット 0）
- 起点: ユーザー指示「リモート dev をローカル dev にマージ → 本ブランチにマージし conflict・CI fail を解消して push、解消内容を skill へ反映」。スコープ = 現在 WT・現在ブランチのみ（フラグ不在ゆえ単一スコープ S-SUB 自動確定・他 WT 非介入）。
- 取込: dev 新規 5 コミット = `38f114081`(#1185 開催日ドロワー出席一括追加) / `da55dd22f`(#1179 /members タグ絞り込み UI/UX) / `35f11255d`(#1187 メンバー詳細 tag source 500 fail-soft) / `64af1891d`(#1181 サイドバー collapsed レイアウト是正) / `db8b5721d`(#1182 ゾーン/参加ステータス検索 0件バグ根治)。
- 事象: `git merge dev --no-edit` で **2 ファイル CONFLICT**（skill index `indexes/topic-map.md` union + `references/task-workflow-active.md` union のみ）→ `pnpm sync:resolve` が union-resolve + `pnpm indexes:rebuild` で全自動解消（残 unmerged 0・WARN unhandled 0 = 手動委譲なし）。`apps/web` / `apps/api` content conflict **0 件**。
- 検証: `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等 drift 0（5504 kw）。merge commit `1ae3a79b6`。CI コード修正なしで全緑。
- **核心則（task 仕様書作成者視点）**: feature 側が `apps/**`（本番コード）を一切 touch せず skill 成果物（artifact-inventory + index）のみ touch しているタスク（= 調査/skill-sync 系）では、dev 側が apps を大きく動かしても sync-merge 衝突は **skill index union に限局**し、`pnpm sync:resolve` 単独で完結する。タスク仕様書の「実装区分=ドキュメントのみ / 観測性のみ」タスクは sync-merge コストが構造的に低い。
- 関連: [[dev-sync-merge-conflict-resolution]] / aiworkflow-requirements 側ミラー changelog と対。
