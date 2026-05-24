# dev sync — ut-dsf-07 staging visual runtime spec ブランチへの dev 取り込み (2026-05-24)

`feat/ut-dsf-07-staging-visual-runtime-spec` に `origin/dev`（members-page prototype alignment #887 取り込み済み）を取り込み、skill 系 3 ファイルの conflict を解消した記録。

## 発生 conflict
- 自動解消（`pnpm sync:resolve` union のみ・残置ゼロ）:
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- 手動解消対象: **なし**（2026-05-19 と異なり `LOGS/_legacy.md` の 3-way block が発生しなかったため resolver で完結）
- auto-merge（conflict なし）: `LOGS/_legacy.md` / `indexes/keywords.json` / `references/task-workflow-active.md` / `apps/web/playwright.config.ts` + members-page prototype alignment の新規 spec / test / completed-tasks doc 群

## 解消経路
1. `git merge dev --no-edit` → 多数 auto-merge + 3 ファイル CONFLICT（すべて `indexes/`）
2. `mise exec -- pnpm sync:resolve` → 3 ファイルを union-resolve し、続けて `pnpm indexes:rebuild` を自動実行（resolver スクリプト内で連鎖）
3. 残コンフリクト・マーカーともゼロを `git diff --name-only --diff-filter=U` / `git grep -l '^<<<<<<< '` で確認
4. `git add -A` → `git commit --no-edit`（merge コミットのため `staged-task-dir-guard` hook は自動スキップ）
5. `apps/web/playwright.config.ts` 等の code auto-merge があったため `pnpm typecheck` / `pnpm lint` を実行（ともに green）
6. `pnpm indexes:rebuild` 再実行で drift ゼロを再確認（CI `verify-indexes-up-to-date` gate 通過保証）
7. `git push`

## 再確認した不変ルール
- `indexes/` の conflict（`quick-reference.md` / `resource-map.md` / `topic-map.md`）は `pnpm sync:resolve` の union で完結する。`quick-reference.md` / `resource-map.md` は手動 ledger だが、conflict 時は resolver の union 対象に含まれる（`indexes:rebuild` の再生成範囲＝`topic-map.md` + `keywords.json` のみ、とは別系統）
- conflict が `indexes/` のみで `LOGS/_legacy.md` の 3-way block が無い場合、手動解消ステップは不要。`L-DEVSYNC-002` playbook がそのまま成立
- `pnpm sync:resolve` は内部で `pnpm indexes:rebuild` を連鎖実行するが、push 前に明示再実行して drift ゼロを再確認するのが安全
- 今回は doc-only ではなく code auto-merge（`playwright.config.ts`）を含んだため typecheck / lint を省略せず実行した（2026-05-19 の「skill のみなら省略可」条件には該当しない）

## 適用先
- このスキル: 既存 `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の `L-DEVSYNC-002` playbook が今回も成立、新規ルール追加なし。本 changelog のみ追加
- `task-specification-creator`: 同 sync の旨を SKILL-changelog に追記
