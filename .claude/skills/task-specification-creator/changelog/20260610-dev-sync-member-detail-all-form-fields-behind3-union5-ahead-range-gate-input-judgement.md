# dev sync mirror: behind 3 / ahead 2・union 5 を sync:resolve 1 パス収束・gate 入力判定は ahead-range で取る（2026-06-10 feat/member-detail-all-form-fields-and-test-account-data）

- 日時: 2026-06-10（`feat/member-detail-all-form-fields-and-test-account-data` への dev 取込・sub-worktree wt-8）
- ブランチ: `feat/member-detail-all-form-fields-and-test-account-data` ← `origin/dev`（**3 behind / 2 ahead**・ローカル dev = origin/dev `da55dd22f` 0/0 同期済み・dev 独自 0）
- 取込 3 コミット: `da55dd22f`(#1179 公開 `/members` タグ絞り込み UI/UX 整形) / `35f11255d`(#1187 admin メンバー詳細 tag source 500 fail-soft) / `64af1891d`(#1181 サイドバー collapsed 是正)
- 解消: content CONFLICT 5（`SKILL.md` + `indexes/{quick-reference,resource-map,topic-map}.md` + `references/task-workflow-active.md`・全 union）・`keywords.json` Auto-merge → `pnpm sync:resolve` exit 0（union 5 + rebuild）→ merge `a1d8b660c`。手動領域 0。
- **🔴task-spec 反映点 SP-DEVSYNC-119**: sync-merge の「取込デルタが gate 入力（01-api-schema / static-manifest / 採番 migration）を touch したか」「feature と取込が同一ソースを二重実装したか（L-DEVSYNC-127 semantic 衝突）」の判定 delta は **merge-base 差分でなく ahead-range `<pre-merge feature HEAD>..<dev-tip>`** で取る。本回 merge-base（`66d18af1b`）差分は feature が過去取込済みの spec/manifest/0028 migration を二重計上し誤検知したが、実取込 `0e92848b5..da55dd22f` では gate 入力 0・source 交差 0。仕様書 Phase 5/11 の sync-merge 検証手順に「評価 delta は ahead-range で取り `merge-base..dev-tip` を使わない」を明記。
- 検証: `pnpm verify:d1-migrations` OK（35 migrations / 5 dup group）/ `pnpm verify:static-manifest` OK / `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / indexes 冪等（5504 kw・drift 0）。CI コード修正なし全緑。
- 反映先: 本 changelog + 両 SKILL-changelog.md 1 行 + `lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-119。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-128 と対。
