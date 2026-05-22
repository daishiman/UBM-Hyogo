# dev sync: `feat/issue-765-1password-vault-restructure` ← `dev` clean union-resolve

- 日時: 2026-05-20
- ブランチ: `feat/issue-765-1password-vault-restructure` ← `dev`
- 事象: `git merge dev` で `SKILL.md` / `indexes/topic-map.md` の 2 ファイルが UU。`pnpm sync:resolve` 一発で union-resolve が完了し exit 0。`indexes/keywords.json` は auto-merge で済んでおり `--ours + rebuild` ステップ不要だった。
- 解消: `pnpm sync:resolve` のみで完了。後続の手動 `git checkout --ours` や `pnpm indexes:rebuild` 発火は不要。
- 反映先:
  - 本 changelog エントリ（smooth-case のリファレンス）
  - `task-specification-creator/lessons-learned/` への新規 lesson は追加なし（既存 L-DEVSYNC-001..027 で網羅済み）
