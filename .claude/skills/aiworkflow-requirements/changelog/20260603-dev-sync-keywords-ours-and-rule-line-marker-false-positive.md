# dev sync: keywords.json `--ours` 3 ファイル CONFLICT を `pnpm sync:resolve` 単独完結 + `=` 罫線 false-positive（2026-06-03）

- 日時: 2026-06-03
- ブランチ: `fix/shell-collapse-cookie-secure-attribute` ← `dev`（6 behind / 2 ahead、ローカル dev = origin/dev 済で dev 同期は no-op）
- 関連: `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-037（5 回目事例）/ task-specification-creator `lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-012
- 事象: content CONFLICT は `indexes/keywords.json`（派生物 = `--ours`）+ `indexes/topic-map.md`（union）+ `references/task-workflow-active.md`（union）の 3 件のみ。`indexes/{quick-reference,resource-map}.md` / `SKILL-changelog.md` / `LOGS/_legacy.md` は git auto-merge で衝突回避。
- 解消: `pnpm sync:resolve` 1 回で union 2 + `--ours` 1 + 内部 `pnpm indexes:rebuild`（keywords 5362 件）完遂。merge commit `95fea5b08` 後の確認 rebuild は drift 0、chore(indexes) 分離不要。L-DEVSYNC-037 のフォールバック不要結論を **5 ブランチ連続**で回帰確認。
- 教訓（`=` 罫線 false-positive）: 残存マーカー確認の素朴 `git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` は `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-11/manual-smoke-log.md` の 60 個 `=` 罫線を前方一致で誤検出する。実マーカー（`<<<<<<<` / `>>>>>>>`）は 0 件・HEAD/origin/dev 両方に同罫線が存在しマージ非変更（L-DEVSYNC-010 の HEAD/dev fact 差分でもない）。当該ファイルは L-DEVSYNC-035-A（CI `verify-conflict-markers.yml` 同条件の pathspec 除外）の除外リストにも非該当の通常 workflow doc。**残存判定は `git ls-files -u | wc -l` = 0 を正本にし、grep は `^=======$` 完全一致**で判定する。
- 検証: `pnpm sync:resolve` → `git ls-files -u` 0 → merge commit → `pnpm install` / `pnpm typecheck`（全 package Done）/ `pnpm lint`（exit 0）/ `pnpm indexes:rebuild` drift 0 で all green。CI failure なし。
