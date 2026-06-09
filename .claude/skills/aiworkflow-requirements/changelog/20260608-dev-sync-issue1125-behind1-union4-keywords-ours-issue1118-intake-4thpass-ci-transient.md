# dev sync 4th pass: 1 コミット取込（#1159）で union 4 + `keywords.json` --ours 解消 + **CI 失敗は npm socket timeout の一時インフラ障害（コード非修正・push 再走で解消）**（2026-06-08 issue-1125・同日 4 回目）

- 日時: 2026-06-08（`docs/issue-1125-bulk-tag-result-staging-mutation-visual-baseline-spec` への dev 取込・**同日 4 回目**）
- ブランチ: `docs/issue-1125-bulk-tag-result-staging-mutation-visual-baseline-spec` ← `origin/dev`（sub-worktree wt-3・**1 behind / 8 ahead**・前回 sync 後に dev へ #1159 が 1 件 land・ローカル dev = origin/dev 0/0 で同期不要）
- 起点: ユーザー指示「CI が失敗していたら CI を改善・コンフリクトが発生していたら解消」。
- 関連: 同日 1〜3 回目 [[20260608-dev-sync-issue1125-behind8-union4-keywords-ours]] / [[20260608-dev-sync-issue1125-behind1-union4-keywords-ours-issue1119-intake]] / [[20260608-dev-sync-issue1125-behind1-union4-keywords-ours-issue1117-intake-3rdpass]] / `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/098/107**
- 取込: dev 新規 1 コミット = `ece2ec8b2`(#1159 tag catalog lifecycle UI を新規 `/admin/tags/catalog` に追加 issue-1118)

## CI 失敗の切り分け（核心・新規データ点）
- `gh pr checks 1164` 集計 = **1 fail / 42 pass / 4 skipping**。fail は `verify (macos-14)`。
- `gh run view --job <id> --log-failed` で原因特定: **`./.github/actions/setup-project`（pnpm install）が npm registry への `ERR_SOCKET_TIMEOUT` を全リトライ消尽（`Will retry ... 1 retries left` → `FetchError: ... Socket timeout` → `##[error]Process completed with exit code 1`）**。
- 判定: **コード起因ではない一時的ネットワーク/インフラ障害**（macOS runner の npm socket timeout）。コード/設定の修正対象ではない。
  - 識別子: 失敗が `setup-project` / `pnpm install` ステップ + `ERR_SOCKET_TIMEOUT`/`Socket timeout`/`registry.npmjs.org` の組合せなら transient と断定してよい（lint/typecheck/test の assert 失敗とは層が違う）。
  - 対処: **再実行で解消**。本件は同時にコンフリクト解消 push を行うため、新 HEAD で CI が丸ごと再走し旧 fail run は PR 最新コミットから外れて無効化される（`gh run rerun --failed <runId>` を別途打つ必要なし）。push が無い純粋な transient fail の場合のみ `gh run rerun --failed` を使う。
- **教訓（CI 改善 ≠ 常にコード修正）**: 「CI を改善せよ」の指示でも、失敗が transient infra なら正しい改善は「再実行」であり、コード/yml をいじるのは誤り（緑だった同一コードを壊すリスク）。assert 系 fail と infra 系 fail を `--log-failed` で必ず層判定する。

## コンフリクト解消
- PR は #1159 land で再び `mergeable: UNKNOWN→CONFLICTING` 相当（1 behind）。content CONFLICT は **5 file**＝`SKILL.md` + `indexes/{quick-reference, resource-map, topic-map}.md`（union 4）+ `indexes/keywords.json`（`--ours` → rebuild）で **aiworkflow 側のみ衝突・task-spec SKILL.md 非衝突**（同日 1〜3 回目と完全同一）。
- 解消: `pnpm sync:resolve` 1 回（`union-resolving 4 files` + `--ours` + `indexes:rebuild`）で `all skill / index conflicts resolved`・`--diff-filter=U` 0 / マーカー 0。merge `4338afb1b`（lefthook 全 pass・MERGE_HEAD で staged-task-dir-guard auto-skip）。
- ローカル検証: #1159 apps/web 同梱ゆえ `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0。
- **union member は intake コミット数に非依存を同一ブランチ同日 behind 8→1→1→1 の 4 連続で実証**（L-DEVSYNC-097-A 独立変数則）。

- 反映先: 本 changelog（**transient CI fail 切り分け則** + 同日 4 連続データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避で起こさず L-DEVSYNC-097/098/107 の確定データ拡張として記録。
