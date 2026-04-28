# Lessons Learned: HealthPolicy 移管 / Worktree コンフリクト解消（2026-04）

> 分離元: [lessons-learned-current-2026-04.md](lessons-learned-current-2026-04.md)

---

## UT-HEALTH-POLICY-MAINLINE-MIGRATION-001 shared policy 移管 教訓（2026-04-08）

### L-HP-001: async hook テストは renderHook 後に 1 ティック待つ

| 項目       | 内容                                                                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状       | `renderHook(() => useMainlineExecutionAccess())` 直後にアサートすると `act(...)` 警告が出る                                                                                   |
| 原因       | async state update が即座に反映されず、テストが非同期更新を待たない                                                                                                          |
| 解決策     | `await act(async () => { await new Promise(r => setTimeout(r, 0)); })` を renderHook 後に挟む、または flush helper を共通化する                                              |
| 再発防止   | async な hook テストは `renderAccessHook` のような flush 済み wrapper を用意し、個別テストで都度 act を書かない                                                              |
| 関連タスク | UT-HEALTH-POLICY-MAINLINE-MIGRATION-001                                                                                                                                      |

### L-HP-002: shared 側正本への純粋関数集約でフック責務が薄くなる

| 項目       | 内容                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状       | hook 内に独自の `apiKeyDegraded` 計算ロジックが重複し、同じ条件が別ファイルで異なる計算式になるリスクがあった                                                                  |
| 原因       | HealthPolicy の集約場所が shared になかったため、各 hook が独自に計算していた                                                                                                 |
| 解決策     | `resolveHealthPolicy()` を `packages/shared/src/types/health-policy.ts` に純粋関数として実装し、hook は呼び出すだけにする                                                    |
| 再発防止   | ドメインルールは shared 側に集約し、hook 側は UI 状態のマッピングだけを持つ。重複計算は将来的な不整合の温床になるため early に集約する                                        |
| 関連タスク | UT-HEALTH-POLICY-MAINLINE-MIGRATION-001                                                                                                                                       |

### L-HP-003: Phase 12 成果物の canonical ファイル名は task 開始時に確定する

| 項目       | 内容                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状       | `outputs/phase-12/` に前タスクの draft と今回の canonical が混在し、どちらが正本か判断に迷った                                                                                |
| 原因       | Phase 12 着手前にファイル名の canonical set を確定していなかった                                                                                                              |
| 解決策     | Phase 12 着手時に `outputs/phase-12/` の既存ファイルを棚卸しし、今回出力する canonical 名（`implementation-guide.md` / `system-spec-update.md` / `documentation-changelog.md` / `untasked-detection-report.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）を先に決める |
| 再発防止   | Phase 12 着手時の初手チェックとして「`outputs/phase-12/` の canonical ファイル名の確定」を明示する。`index.md` と `artifacts.json` の status 同期も同一 wave で行う           |
| 関連タスク | UT-HEALTH-POLICY-MAINLINE-MIGRATION-001                                                                                                                                       |

---

## TASK-FIX-WORKTREE-CONFLICT-001: 並列 worktree コンフリクト解消

### L-WC-001: merge 戦略はファイルの「情報の性質」で決める

| 項目 | 内容 |
|------|------|
| 症状 | 50〜60本の並列 worktree ブランチが `.claude/skills/` 配下を更新するとマージコンフリクットが頻発 |
| 原因 | 追記型テキスト（LOGS.md）・JSON 構造体（EVALS.json）・自動生成ファイル（indexes/*.json）・静的仕様（SKILL.md）が同じ merge 戦略で扱われていた |
| 解決策 | 追記型 → `merge=union`、JSON 構造・自動生成 → `merge=ours` + post-merge 再生成、静的仕様 → 変更履歴を別ファイルに分離して `merge=union` |
| 再発防止 | 新しいファイルを `.gitattributes` に追加する際は「追記型か・構造化データか・自動生成か・静的仕様か」を最初に判断する |
| 関連タスク | TASK-FIX-WORKTREE-CONFLICT-001 |

### L-WC-002: シェルスクリプトの外部コマンドは `command -v` で存在確認する

| 項目 | 内容 |
|------|------|
| 症状 | `set -euo pipefail` 環境で `node: command not found` → 終了コード 127 でフックが失敗 |
| 原因 | `[ -f "$SCRIPT" ]` でスクリプト存在確認はしていたが、`node` コマンド自体の存在確認がなかった |
| 解決策 | `command -v node > /dev/null 2>&1 &&` を条件に追加し、node 不在時は正常終了 |
| 再発防止 | `set -euo pipefail` 環境では外部コマンドの呼び出し前に必ず `command -v <cmd>` で存在確認する |
| 関連タスク | TASK-FIX-WORKTREE-CONFLICT-001 |

### L-WC-003: husky を使うプロジェクトでは git フックパスが `.husky/_/` になる

| 項目 | 内容 |
|------|------|
| 症状 | `git rev-parse --git-path hooks/post-merge` が `.git/hooks/post-merge` ではなく `.husky/_/post-merge` を返す |
| 原因 | プロジェクトが husky を使用しており、`core.hooksPath=.husky/_` が設定されている |
| 解決策 | `git rev-parse --git-path hooks/post-merge` の返り値をそのままインストール先として使う（パスを決め打ちしない） |
| 再発防止 | フックのインストール先は常に `git rev-parse --git-path hooks/<hook-name>` で動的に解決する |
| 関連タスク | TASK-FIX-WORKTREE-CONFLICT-001 |

---

## task-worktree-environment-isolation 教訓（2026-04-28）

### L-WTI-001: skill symlink は worktree 間の暗黙共有になる

| 項目 | 内容 |
|------|------|
| 症状 | worktree 側の skill 変更が symlink 実体を通じて別 worktree にも即時反映される |
| 原因 | `.claude/skills` 配下の symlink が worktree ごとのファイル境界をすり抜ける |
| 解決策 | symlink を撤去し、必要な skill は実ファイルとして版管理するか `~/.claude/skills/` 単独配置へ寄せる |
| 再発防止 | pre-commit / CI で `find .claude/skills -type l` を検出する |
| 関連タスク | task-worktree-environment-isolation |

### L-WTI-002: tmux の global environment に worktree 固有値を置かない

| 項目 | 内容 |
|------|------|
| 症状 | 既存 tmux session や新規 pane が前 worktree の `UBM_WT_*` / path 状態を継承する |
| 原因 | tmux global environment と shell export が session 境界を越えて共有される |
| 解決策 | `update-environment` を最小化し、worktree 固有値は `tmux new-session -e` で session-scoped に注入する |
| 再発防止 | Phase 11 smoke で global に `UBM_WT_*` が無いこと、対象 session にのみ値があることを確認する |
| 関連タスク | task-worktree-environment-isolation |

### L-WTI-003: worktree 作成は git 実行前に lock を取る

| 項目 | 内容 |
|------|------|
| 症状 | 同名ブランチを並列作成すると半端な `.worktrees/<name>` や branch 作成競合が残る |
| 原因 | `git fetch` / `git worktree add` の前に排他制御がない |
| 解決策 | `.worktrees/.locks/<branch-slug>.lockdir` を `mkdir` で取得し、後発を exit 75 で止める |
| 再発防止 | owner metadata（pid / host / ts / wt）を lockdir に保存し、stale lock の判断材料を残す |
| 関連タスク | task-worktree-environment-isolation |

### L-WTI-004: docs-only / NON_VISUAL の Phase 11 はログ3点で証跡固定する

| 項目 | 内容 |
|------|------|
| 症状 | docs-only / NON_VISUAL タスクの Phase 11 で screenshot を作れず、`manual-smoke-log.md` の証跡形式が毎回ぶれる |
| 原因 | NON_VISUAL の代替証跡フォーマットが個々のタスクに委ねられていた |
| 解決策 | `tmux show-environment -g`（global に worktree 固有値が無いこと）/ `find .claude/skills -type l`（symlink ゼロ）/ 二重起動 `exit 75`（lockdir 競合の終了コード）の **ログ3点** を Phase 11 manual-smoke-log の固定セクションに据える |
| 再発防止 | docs-only / NON_VISUAL タスクの `outputs/phase-11/manual-smoke-log.md` テンプレートに3点固定セクションを明記。representative artifact が無い設計判断を Phase 11 main.md に残す |
| 関連タスク | task-worktree-environment-isolation |

### L-WTI-005: 横断依存 5 タスクの wave 同期は carry-over と新規範囲を分離する

| 項目 | 内容 |
|------|------|
| 症状 | conflict-prevention / lefthook / worktree-environment-isolation / branch-protection / claude-code-permissions の 5 タスクが横並びで進行し、前 wave の carry-over が新規 wave 内容に紛れ込む |
| 原因 | wave 間の責任境界が曖昧で、carry-over 修正と新規 spec が同じ Phase 12 成果物に同居していた |
| 解決策 | Phase 12 着手時に `system-spec-update-summary.md` の章構成を「(A) 前 wave からの carry-over」「(B) 本 wave 新規範囲」に二分し、skill 反映指示も対応する 2 ブロックに分ける |
| 再発防止 | cross_task_order を持つ wave では artifact-inventory に `cross_task_order` 行を必ず置き、carry-over 起点を artifact 単位で追跡できるようにする |
| 関連タスク | task-worktree-environment-isolation / task-conflict-prevention-skill-state-redesign / task-git-hooks-lefthook-and-post-merge / task-github-governance-branch-protection / task-claude-code-permissions-decisive-mode |

### L-WTI-006: spec_created の skill 反映は 4 点セットで同期する

| 項目 | 内容 |
|------|------|
| 症状 | spec_created タスクで development-guidelines にだけ反映、または lessons-learned にだけ反映、と粒度がぶれて後続タスクが正本にたどり着けない |
| 原因 | spec_created 時の skill 反映粒度が標準化されていなかった |
| 解決策 | spec_created 時は **(1) development-guidelines に契約表（current contract）/ (2) lessons-learned に教訓 / (3) task-workflow-active に現況 / (4) topic-map + keywords に索引** の 4 点セットを同一 wave で必ず更新する |
| 再発防止 | aiworkflow-requirements の skill 反映チェックリストに 4 点セットを明記。各 spec_created タスクの Phase 12 `skill-feedback-report.md` に 4 点の反映状態欄を設ける |
| 関連タスク | task-worktree-environment-isolation |

### L-WTI-007: worktree-aware path 解決を shell init / mise / tmux で一貫させる

| 項目 | 内容 |
|------|------|
| 症状 | worktree から `git rev-parse --git-path hooks/...` で取得すべきパスが、shell init や tmux pane で別 worktree のパスを返す |
| 原因 | shell init / mise activate / tmux pane の各層で worktree 検出方法が揃っておらず、`PWD` ベースと `git rev-parse` ベースが混在 |
| 解決策 | 各層で `git rev-parse --git-path <subpath>` または `git rev-parse --show-toplevel` を一次情報として使う。決め打ちの `.git/...` パスを禁止し、shell init / mise / tmux のすべてで同じ解決ルールを通す |
| 再発防止 | development-guidelines に「worktree-aware path 解決を 3 層で揃える」ルールを記載。Phase 11 smoke の対象に「異なる worktree pane で `git rev-parse --git-path hooks/post-merge` が当該 worktree を返すこと」を含める |
| 関連タスク | task-worktree-environment-isolation / task-git-hooks-lefthook-and-post-merge |

### L-WTI-008: lockdir owner metadata で stale lock 判定を運用化する

| 項目 | 内容 |
|------|------|
| 症状 | `.worktrees/.locks/<slug>.lockdir` が残留したまま新規 worktree 作成が常に exit 75 で止まる |
| 原因 | 異常終了時に lockdir を残してしまい、stale かどうか判定する手段が無かった |
| 解決策 | lockdir 取得直後に `pid` / `host` / `ts`（ISO8601）/ `wt`（ワークツリーパス）を含む `owner.json` を書き込み、回収側は `pid` 不在 + `ts` 古さ + `host` 一致で stale 判定する |
| 再発防止 | 後続実装タスクで lockdir GC（cron / pre-create check）を起票。`new-worktree.sh` の lockdir 取得後に owner metadata 書き込みを必須化 |
| 関連タスク | task-worktree-environment-isolation |
