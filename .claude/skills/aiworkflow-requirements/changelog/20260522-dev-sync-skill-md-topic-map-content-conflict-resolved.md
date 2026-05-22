# dev sync: SKILL.md / indexes/topic-map.md content conflict 標準フロー解消

- 日時: 2026-05-22
- ブランチ: `feat/step-05-followup-001-runtime-screenshot` ← `dev`
- 事象: `git merge dev` で `.claude/skills/aiworkflow-requirements/SKILL.md` と `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` の 2 ファイルに `CONFLICT (content)` が発生。`.gitattributes` の `merge=union` 対象だが、両側で関連する行への変更があり git の自動 union が失敗するパターン。
- 解消（標準フロー、所要 < 1 分）:
  1. `pnpm sync:resolve` → 2 ファイルとも `union-resolved` で完了
  2. `git commit --no-edit` でマージコミット
  3. `pnpm indexes:rebuild` → `topic-map.md` に正規化差分（8 insertions / 16 deletions）が出るため追加コミット
  4. `git push`
- 反映: 本 changelog（standard pattern 記録のみ）。lessons-learned に新規記述は不要（既存 `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` でカバー済み）。
- 学び:
  - `sync:resolve` 実行後は必ず `pnpm indexes:rebuild` で drift を解消してから push する（`verify-indexes-up-to-date` gate を先回りで通すため）。
  - `SKILL.md` / `indexes/topic-map.md` は dev sync 時の高頻度コンフリクト対象。resolver が安定して効くので、ユーザー確認なしで自律解消してよい標準パターン。
