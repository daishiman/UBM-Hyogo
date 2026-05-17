# Lessons Learned — dev sync merge conflict 解消パターン (2026-05)

`origin/dev` を feature ブランチへ取り込む際に、複数 wave の workflow が並行で `.claude/skills/aiworkflow-requirements/` および `.claude/skills/task-specification-creator/` の changelog / index / active workflow / completed-tasks doc に additive 行を書き込むため、merge 時に高頻度で diff3 conflict が発生する。本書はその自律解消ポリシーの正本。

## L-DEVSYNC-001: SKILL.md / SKILL-changelog.md / references/task-workflow-active.md / docs/30-workflows/LOGS.md の changelog 表 conflict
- 症状: HEAD 側と dev 側が同じ表に**別々の追加行**を入れたために `<<<<<<< / ||||||| base / ======= / >>>>>>>` で囲まれる。
- 解消: HEAD 側追記行と dev 側追記行を**両方残し**、`||||||| base` セクション（共通祖先）は破棄する。重複行があれば版番号で最新側を採用。
- 自動化: `<<<<<<< HEAD\n(...A...)(\|\|\|\|\|\|\| base\n(...B...))?=======\n(...C...)>>>>>>> dev` を `A + C` に置換する Python regex（state machine: normal / head / ancestor / theirs の4状態。ancestor section は破棄）。base セクションは optional。
- Why: changelog / 30-workflows/LOGS.md は append-only であり両側追加に semantic conflict はない。
- 適用範囲: markdown table (`| ... |` 行) と markdown bullet list には安全。JSON 配列 (keywords.json) には**適用禁止**（L-DEVSYNC-002 参照）。

## L-DEVSYNC-002: indexes/ ファイル (keywords.json / resource-map.md / topic-map.md / quick-reference.md) の conflict
- 症状: `pnpm indexes:rebuild` で生成される派生ファイルが両側で別タイミングで再生成されたために大量の reference 行が衝突。
- 解消: `git checkout --ours <path>` または `git checkout --theirs <path>` のいずれかで片側を採用し、merge commit 解消後に `pnpm indexes:rebuild` を実行して**派生ソース（SKILL/changelog/references）から再生成**する。
- Why: indexes は派生物であり rebuild が決定的（同じ入力 → 同じ出力）。merge 段階での `--ours/--theirs` 選択は rebuild 後の最終状態に影響しない。手で union 解決すると JSON 配列の末尾カンマや重複 entry で構文破壊するリスクがあるため、**JSON 派生物には union 解決を使わない**。
- 補強事例 (2026-05-17 dev sync): HEAD 側に新規 lessons-learned/workflow inventory entry が既に追加済みでも、`--ours` 採用後 rebuild すれば自動的に keywords.json に反映される。`--theirs` 採用でも結果は同じ。
- 関連: CLAUDE.md `pnpm indexes:rebuild` を「post-merge 廃止後の正規経路」と規定。CI gate `verify-indexes-up-to-date` がリポジトリの drift を検出する。

## L-DEVSYNC-003: docs/30-workflows/completed-tasks/*.md の conflict
- 症状: 同タスクのドキュメント行を HEAD と dev が並行更新。
- 解消: L-DEVSYNC-001 と同じく両側採用が原則。同一行が片側だけで semantic に変化している場合は dev 側を採用（dev = staging-validated 正本）。

## L-DEVSYNC-004: merge commit と pre-commit hook
- merge commit (`MERGE_HEAD` 存在時) は `staged-task-dir-guard` を自動 skip するため `--no-verify` 不要。
- 例外: hook 設定が古い worktree（`scripts/hooks/staged-task-dir-guard.sh` が `MERGE_HEAD` を見ない実装）では `--no-verify` が必要になる場合がある。検出時は hook 側を修正する（CLAUDE.md の sync-merge 個人開発ポリシー）。

## L-DEVSYNC-005: indexes rebuild の二段 commit パターン
- 推奨フロー:
  1. merge 対象を解消し `merge: sync <branch> with dev` で merge commit を作成（indexes は dev 側 = `--theirs`）
  2. `pnpm indexes:rebuild` を実行
  3. 派生差分があれば `chore(indexes): rebuild after dev sync merge` で別 commit
- Why: merge commit と再生成 commit を分けると、後で indexes 再生成だけを revert / replay できる。

## L-DEVSYNC-006: pre-push hook `gate-metadata-guard` の schema 違反 (2026-05-17 追記)
- 症状: `git push` が pre-push hook の `verify-gate-metadata` 同等チェックで停止。`artifacts.json` の `metadata.gates[].status` が `"completed"` / `"verified"` / `"blocked"` のいずれかを使っている場合、zod schema が `"pending" | "passed" | "failed" | "waived"` のみを受け入れるため `ERROR`。
- 解消: 以下の正規変換を適用し、`passed_at` (ISO8601 文字列 or null) と `approver` (`"local"` / `"daishiman"` 等) を追加。
  - `completed` → `passed` (`passed_at` 必須、`approver: "local"`)
  - `verified` → `passed` (同上)
  - `blocked` / `user-gated` → `pending` (`passed_at: null`、`approver: "daishiman"`)
- 関連: `evidence_path` がワークフローの `completed-tasks/` 移動前パスのままだと `evidence_path not found` ERROR が出る。移動後の `docs/30-workflows/completed-tasks/<task>/...` に追従させる。
- 整合性: `artifacts.json` と `outputs/artifacts.json` の `metadata.gates` は同一であるべき（CI gate が両方を独立検証する）。
- Why: skill の正規 schema は `scripts/gate-metadata/validate.ts` の zod schema が SSOT。Phase 12 / 13 spec の表記揺れ（`completed` / `verified` / `blocked`）は人間向けで、artifacts.json の `status` field とは別軸。

## L-DEVSYNC-007: 予防策レイヤー (2026-05-17 追加)

事後解消だけでなく、構造的予防を以下 3 層で実装する:

### 層 1: `.gitattributes` `merge=union` driver
- 対象: 純粋な append-only ファイル（混在しないもの）のみ:
  - `docs/30-workflows/LOGS.md`
  - `.claude/skills/*/SKILL-changelog.md`
- 効果: git が自動で両側の追加行を結合する → コンフリクト自体が発生しない。
- 制約: union driver は「単に両側の non-conflicting 行を残す」だけなので、同一行を両側で書き換えるとそのまま結合され重複行になる。append-only な表に限定する。
- 適用禁止: 段落・コード・設定が混ざるファイル（SKILL.md / task-workflow-active.md / indexes/*.md / *.json）。union が semantic content を破壊する。

### 層 2: 混在ファイル用 union resolver スクリプト
- 場所: `scripts/sync/resolve-skill-merge-conflicts.sh`
- 起動: `pnpm sync:resolve`（merge 進行中のみ実行可）
- 動作:
  - 既定 union 対象（SKILL.md / task-workflow-active.md / indexes/{resource,topic,quick-reference}-map.md）に L-DEVSYNC-001 の Python state machine を適用
  - `indexes/keywords.json` には `git checkout --ours` 後 `pnpm indexes:rebuild` で再生成（L-DEVSYNC-002）
  - 未知の conflict path は WARN のみで報告（破壊禁止）
- Why: 層 1 を適用できない「混在だが changelog table 部分だけ衝突する」ファイルを冪等に解消する。失敗しても merge state は失われないため再実行可能。

### 層 3: ドキュメント・運用ポリシー
- CLAUDE.md / lefthook sync-merge セクションから本書を参照
- dev sync 手順:
  1. `git merge dev --no-edit`
  2. conflict 発生時は `pnpm sync:resolve` を実行（層 2）
  3. 残った未解消は手動解消（L-DEVSYNC-001/002 ルールに準拠）
  4. `git commit` で merge commit を確定（pre-commit `staged-task-dir-guard` は merge 中スキップ）
  5. `mise exec -- pnpm typecheck && pnpm lint`
  6. `git push`（pre-push `gate-metadata-guard` / `indexes-drift-guard` が gate）

## 適用範囲
- task-specification-creator skill: 本 Lessons Learned は SKILL.md / changelog / references の conflict 解消にもそのまま適用される。Phase 12 で `artifacts.json` を出力する際は L-DEVSYNC-006 の status enum / passed_at / approver / evidence_path を必ず満たす。
- aiworkflow-requirements skill: indexes 再生成は本 skill 配下で完結する。
