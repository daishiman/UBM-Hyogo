# dev sync merge — 既存予防策 (L-DEVSYNC-001..007) 再適用記録 (2026-05-18)

`feat/ut-cicd-drift-verify-indexes-trigger-recovery-sop` への `dev` 取り込み時に再発した conflict を、`lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の既存ポリシーで全件自律解消できた事を確認した。

## 発生 conflict
- `.claude/skills/aiworkflow-requirements/SKILL.md`（changelog 行 / index 行の同表内併走追記）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`

## 解消経路
1. `git merge dev --no-edit` → 上記 2 ファイルで CONFLICT
2. `pnpm sync:resolve`（`scripts/sync/resolve-skill-merge-conflicts.sh`）が L-DEVSYNC-001 の state machine で両側追記行を結合
3. 残ファイル（changelog/* / lessons-learned/* / indexes/keywords.json 等）は git の auto-merge で衝突なし完了
4. `git add -A` → merge commit → `pnpm typecheck` / `pnpm lint` いずれも PASS

## 再確認した不変
- `.gitattributes` `merge=union` driver（層1）+ `pnpm sync:resolve`（層2）の二段構成で SKILL.md / indexes/*-map.md の併走追記コンフリクトは追加の手作業なしで解消できる。
- 派生 JSON（`indexes/keywords.json`）は今回 auto-merge で済んだが、`--ours + pnpm indexes:rebuild` の経路（L-DEVSYNC-002）が依然 fallback として有効。
- pre-commit hook は merge commit 時 `staged-task-dir-guard` 自動 skip（L-DEVSYNC-004）が機能し `--no-verify` 不要。

## 適用先
- このスキル: 既存 `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の予防策が十分有効。追加 lesson は不要。
- `task-specification-creator` skill: 同パターンが `task-specification-creator/changelog/` 系でも発生し得るため、対応 changelog entry を別途追加（参照: `20260518-dev-sync-merge-resolution-replay.md`）。
