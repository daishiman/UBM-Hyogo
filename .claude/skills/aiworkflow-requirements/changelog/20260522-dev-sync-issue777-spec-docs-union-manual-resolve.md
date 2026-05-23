# dev sync: spec docs (01-api-schema / 11-admin-management) 手動 union 解消（issue-777 schema diff resolve history view）

- 日時: 2026-05-22
- ブランチ: `feat/issue-777-schema-diff-resolve-history-view` ← `dev`
- 事象: `pnpm sync:resolve` が skill 系 4 ファイル を `union-resolved`、`keywords.json` を `--ours + rebuild` で解消するが、`docs/00-getting-started-manual/specs/01-api-schema.md` / `docs/00-getting-started-manual/specs/11-admin-management.md` / `.claude/skills/aiworkflow-requirements/references/workflow-serial-05-step-03-schema-diff-resolve-artifact-inventory.md` の 3 ファイルが `unhandled conflict` として残置（resolver は spec docs を union 対象に含めない仕様のため、想定通りの挙動）。
- 解消:
  - artifact inventory は dev 側を採用（issue #775 完了側で screenshots `completed` + playwright evidence を保持する最新形）。
  - spec docs 2 件は HEAD 側（issue #777 history view 仕様）と dev 側（issue #776 bulk resolve 仕様）が独立した節を追加していたため、conflict marker を除去して両方の節を残す **手動 union** で解消。base section (`||||||| <sha>`) は両側で空のため削除のみで足りる。
  - `python3` ワンライナーで `<<<<<<< HEAD ... ||||||| ... ======= ... >>>>>>> dev` ブロックを正規表現置換し、`HEAD section + dev section` に折り畳む処方を採用（Edit ツールで JP 全角括弧の bytes mismatch が頻発したため）。
- 反映先:
  - 本 changelog（standard pattern としての記録）。
  - `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の既存 L-DEVSYNC ナレッジで十分カバーされており新規 lesson は不要。
- 学び:
  - spec docs（`docs/00-getting-started-manual/specs/`）は `.gitattributes` の `merge=union` 対象外。意味的に独立した節の追加同士なら手動 union で安全に統合できるが、同一節内の同一行への両側変更が含まれる場合はファイル単位 union ではなく行単位の意図統合が必要。
  - Edit ツールで JP 全角括弧（`（` `）`）が含まれる長文 conflict block は bytes-level mismatch を起こしやすい。`python3 + re` での conflict marker 除去が確実。
