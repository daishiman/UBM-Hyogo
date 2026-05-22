# dev sync merge — task-specification-creator 派生ファイル衝突予防の再確認 (2026-05-18)

`feat/ut-cicd-drift-verify-indexes-trigger-recovery-sop` への `dev` 取り込み時、task-specification-creator skill 配下では changelog / SKILL.md / indexes/* に追加的衝突は発生しなかった。これは `aiworkflow-requirements` で確立した予防策（`.gitattributes` `merge=union` + `pnpm sync:resolve`）が task-specification-creator 配下にも対称適用されている事の確認。

## 不変
- `.claude/skills/task-specification-creator/SKILL-changelog.md` は `.gitattributes` で `merge=union`。
- `SKILL.md` / `references/task-workflow-active.md` / `indexes/{resource,topic,quick-reference}-map.md` の併走追記衝突は `pnpm sync:resolve` で自動解消可能。
- `indexes/keywords.json` は `--ours + pnpm indexes:rebuild` を fallback とする。

## 運用
- dev 取り込み手順は `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` を参照。task-specification-creator 独自の追加ルールは不要。
- pre-commit `staged-task-dir-guard` は merge commit 自動 skip 済み（CLAUDE.md sync-merge 個人開発ポリシー）。
