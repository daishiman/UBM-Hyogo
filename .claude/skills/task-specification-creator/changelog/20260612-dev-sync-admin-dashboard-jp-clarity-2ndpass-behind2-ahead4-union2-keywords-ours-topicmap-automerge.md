# dev sync 2nd pass: 2 コミット取込（behind 2 / ahead 4）で **skill index CONFLICT 3（union 2 + keywords `--ours`）・1st pass 衝突 member（SKILL.md/topic-map/resource-map）は Auto-merge へ反転**・content conflict 0・CI fail 0（2026-06-12 feat/admin-dashboard-jp-clarity-and-card-ux 2nd pass・task-spec ミラー）

- 日時: 2026-06-12（同ブランチ 2 回目の dev 取込・sub-worktree task-20260611-085747-wt-9）
- ブランチ: `feat/admin-dashboard-jp-clarity-and-card-ux` ← `dev`（**2 behind / 4 ahead**・ローカル dev = origin/dev `82971d195` 0/0・独自 0 → dev 同期冪等スキップ）
- 取込: #1213(公開・会員 8 画面の共通レイアウト層 PageShell/SectionCard/ButtonLink 統一) / #1233(完了済みワークフロー文書群整理 + sync-merge lessons-learned 更新)。
- **task-spec 側ファイルは衝突 0**（SKILL-changelog 含め全 Auto-merge）。CONFLICT 3 は全 aiworkflow 配下 = `indexes/{keywords.json,quick-reference.md}` + `references/task-workflow-active.md`。`apps/**` content conflict 0（#1213 公開・会員層 vs feature /admin 層で touch 分離）。
- **Phase 11 sync-merge 手順への確定データ 2 点**:
  1. **同一ブランチ連続 pass でも衝突 member は入替る（SP-DEVSYNC-089/098/111 系の連続 pass 側拡張）**: 1st pass（数時間前）union 5 + ours 1 の 6 件天井 → 2nd pass 3 件・SKILL.md/topic-map/resource-map は Auto-merge へ反転、keywords は再衝突。「前 pass の衝突 file リスト」を次 pass の見積りに使わず、毎回 `sync:resolve` 実出力で確認する記載が正。
  2. **dev 側 lessons-learned / 30-workflows 大整理の取込（#1233）も特別扱い不要**: `.gitattributes` `merge=union`（LOGS / SKILL-changelog / lessons-learned）が自動吸収し resolver 対象は通常 index のみ。文書整理系取込で手動解消手順を仕様書に積まない。
- 検証: stale lock 上書き続行 → fetch 0/0 → merge CONFLICT 3 → `pnpm sync:resolve`（union 2 + ours 1 + rebuild・exit 0）→ マーカー検証→add→commit 1 Bash 原子連結（SP-DEVSYNC-135 準拠）で merge `d1e405196` → committed blob マーカー 0 → 取込デルタ lock/pkg 変更なし＝install 省略可 → `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / indexes:rebuild 冪等（5519 kw・drift 0）。CI コード修正 0・spec 生成手順への影響 0 ゆえ新規 SSOT 不要。
- 反映先: aiworkflow changelog `20260612-dev-sync-admin-dashboard-jp-clarity-2ndpass-behind2-ahead4-union2-keywords-ours-topicmap-automerge.md` が正本・本ファイルはミラー + 両 SKILL-changelog.md 1 行。新規 lesson は起こさず L-DEVSYNC-123-A（連続 pass member 入替り）の確定データ拡張。
