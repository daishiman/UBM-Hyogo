# Phase 1: 要件定義 — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 1（要件定義） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 上位依存 | task-conflict-prevention-skill-state-redesign |
| 後続ブロック | （なし） |

## 1. 背景

UBM 兵庫支部会リポジトリでは、複数機能の並列開発のために git worktree を `.worktrees/` 配下に多数生成し、そこで Claude Code / tmux / shell を並走させている。一方で以下の状態漏れが頻発しており、別タスク・別プロジェクトとの混線リスクが顕在化している。

1. **skill symlink の汚染**: `.claude/skills/` に他リポジトリのスキルが symlink で混入し、ワークツリー間で意図しないスキル定義が共有されている。
2. **tmux 環境変数の引き継ぎ**: 既存 tmux セッションを attach した際、別 worktree で設定した `PWD` / `CLAUDE_PROJECT_DIR` / `OP_SERVICE_ACCOUNT_TOKEN` 等が新しいペインに引き継がれ、誤った worktree でコマンド実行が起きる。
3. **gwt-auto の競合**: 同じブランチ名で別タブから worktree を作成すると `git worktree add` が衝突し、半端な状態（`.worktrees/<name>` だけ存在 / branch は別タブが保有）に陥る。
4. **shell state の継承**: ターミナルタブを派生（`Cmd+T`）すると親シェルの `PATH` / `MISE_ENV` / `direnv` 状態がそのまま引き継がれ、worktree 切替後も古い Node バージョンが使われる事例がある。

上位タスク `task-conflict-prevention-skill-state-redesign` でスキル側の state 持ち方を整理した結果、本タスクでは **環境分離レイヤー（worktree / tmux / shell）の責務を docs として固定**する。

## 2. スコープ

### 2.1 In Scope

| 領域 | 対象 |
| --- | --- |
| skill symlink | `.claude/skills/` 配下の symlink 撤去方針・代替（per-worktree コピー or グローバル参照のホワイトリスト化）を文書化する |
| tmux | session-scoped state（環境変数 / 命名規則 / window/pane の per-worktree 化）を文書化する |
| gwt-auto lock | `scripts/new-worktree.sh` 実行時の排他制御（lock ファイル位置・取得・解放・タイムアウト）を文書化する |
| shell | `PROMPT` / `PATH` / `MISE_*` / `direnv` の per-worktree 初期化方針を文書化する |
| 受け入れ証跡 | NON_VISUAL evidence の取得手順（コマンド出力・lock ファイル状態・スキル一覧 diff） |

### 2.2 Out of Scope

- スキル本体のロジック変更（上位タスクで完結済み）
- Cloudflare / GitHub / D1 など外部サービス側の設定
- 実装コードの投入（本タスクは docs-only / spec_created）
- IDE / editor 個別設定（VS Code, nvim 等）

## 3. 関係者

| ロール | 責務 |
| --- | --- |
| platform / dev-environment owner | 設計・レビュー・Phase 2-3 確定 |
| Claude Code エージェント | 設計に従い後続実装タスクで適用 |
| 開発者（ユーザー） | Phase 13 で最終承認 |

## 4. 成功基準（受け入れ条件）

`artifacts.json` の `acceptance_criteria` に対応する。

| ID | 受け入れ条件 | 検証手段（Phase 11 想定） |
| --- | --- | --- |
| AC-1 | skill symlink 撤去方針が docs として確定し、撤去後の代替経路が一意に決まっている | `find .claude/skills -type l` の期待出力を docs に明記 |
| AC-2 | tmux session-scoped state の設計が確定し、新規セッションで per-session 環境変数のみが見える | `tmux show-environment -s <session>` と `tmux show-environment -g` の差分が docs と一致 |
| AC-3 | gwt-auto lock 設計が確定し、同一ブランチ並列作成時に後発が明示エラーで即座に終了する | `scripts/new-worktree.sh` 二重起動シナリオの期待挙動を docs に明記 |
| AC-4 | NON_VISUAL evidence の取得手順が docs に記載され、Phase 11 で同手順が再現可能 | コマンド列・期待出力例の docs 化 |

## 5. 前提条件

- `CLAUDE.md` の「ワークツリー作成」「開発環境セットアップ」「Cloudflare 系 CLI 実行ルール」が現状の正本である。
- `scripts/new-worktree.sh` は現状 `git worktree add -b` + `mise install` + `pnpm install` のみを行い、lock 機構を持たない。
- `mise` / `pnpm` / `op` (1Password CLI) はホスト側にインストール済み。
- 上位タスク `task-conflict-prevention-skill-state-redesign` の決定事項（skill 側の state 持ち方）が確定している前提で本タスクを進める。

### 5.1 carry-over 確認

Phase 1 開始時点の直近履歴と差分を確認し、本タスクの新規作業と carry-over を分離した。

```text
bf37703 Merge remote-tracking branch 'origin/main' into feat/wt-5
07c53b8 Merge pull request #128 from daishiman/feat/02c-admin-data-access-boundary
688a16b fix(api): add miniflare/vitest as direct devDependencies
ad05b92 fix(api): extend D1Stmt.run() to expose meta.changes/last_row_id
93763aa merge: sync feat/02c-admin-data-access-boundary with origin/main
```

| 区分 | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| carry-over | `origin/main` merge と 02c admin data access boundary 系の履歴 | 本タスクの scope 外。変更しない |
| current diff inventory | `docs/30-workflows/task-worktree-environment-isolation/` 新規作成、aiworkflow-requirements references / indexes / LOGS 更新 | 本タスクの Phase 12 same-wave sync 対象 |
| implementation files | `apps/desktop/`, `apps/backend/`, `packages/shared/`, `scripts/new-worktree.sh` | docs-only のため変更しない。後続未タスクで実装 |

### 5.2 既存コード命名規則

本タスクは docs-only だが、後続実装タスクが触る候補の命名規則を Phase 1 で固定する。

| 対象 | 既存/採用命名 | 本タスクでの規約 |
| --- | --- | --- |
| shell 関数 | snake_case | `branch_slug`, `acquire_lock_mkdir`, `acquire_lock_flock` |
| shell 変数 | UPPER_SNAKE_CASE | `REPO_ROOT`, `BRANCH`, `WT_PATH`, `BRANCH_SLUG`, `LOCK_PATH` |
| lockdir | kebab-case + hash suffix | `.worktrees/.locks/<prefix-55>-<sha8>.lockdir/owner` |
| tmux session | kebab-case prefix | `ubm-<branch-slug>` |
| docs file | kebab-case | `implementation-guide.md`, `unassigned-task-detection.md` |

## 6. 非機能要件

| 項目 | 要件 |
| --- | --- |
| 可観測性 | lock の取得・解放、skill symlink 撤去、tmux env 設定はログに残せる手順とする |
| 再現性 | 全手順が `bash` ワンライナーまたは `scripts/*.sh` で再現できる |
| 安全性 | 1Password 経由の secret は `.env` 実値を経由しない（`scripts/cf.sh` / `scripts/with-env.sh` 方式を踏襲） |
| 後方互換性 | 既存 `.worktrees/<name>` の構造・命名（`task-<TS>-wt`）を破壊しない |
| 性能 | lock 取得待ちは 0 秒（即時失敗方針）、worktree 作成全体で 60 秒以内 |

## 7. 制約事項（不変条件）

`CLAUDE.md` の「重要な不変条件」と矛盾しないこと。特に以下：

1. D1 への直接アクセスは `apps/api` に閉じる（本タスクはインフラ層なので影響なし、ただし docs 内サンプルでも例示しない）。
2. 平文 `.env` をリポジトリに置かない / 表示しない。lock や session-state ファイルにも secret を書かない。
3. `wrangler` 直接実行禁止。docs サンプルでも `scripts/cf.sh` 経由で記述する。
4. GAS prototype の運用に依存しない。
5. ユーザー承認なしの commit / push / PR 作成を行わない（Phase 13 まで pending）。

## 8. 外部依存

| 依存先 | 形態 |
| --- | --- |
| `task-conflict-prevention-skill-state-redesign` | 完了済み前提。skill state の持ち方の決定を引き継ぐ |
| `.claude/skills/aiworkflow-requirements/` | 設計参照元（Phase 2 設計時に reference を引く） |
| `.claude/skills/task-specification-creator/` | Phase 構成・出力フォーマットの規範 |

## 9. リスクと初期評価

| リスク | 影響 | 初期緩和方針 |
| --- | --- | --- |
| skill symlink を撤去すると既存ワークフローが壊れる | 中 | 撤去前に `find -type l` でインベントリ取得 → 代替経路を明示してから撤去 |
| tmux 既存セッションへの後付けで env が汚染されたまま | 中 | 新規セッションのみ対象。既存セッションは「破棄して作り直し」を docs 明記 |
| lock ファイルが孤児化 | 低〜中 | PID + ホスト名 + タイムスタンプを記録、stale 判定ロジックを Phase 2 で設計 |
| ワークツリーのパスに日本語（`個人開発`）を含む | 中 | lock ファイルパスはクォート前提、空白・マルチバイトを許容するテストを Phase 4 で組む |

## 10. 完了条件

- [x] 本ドキュメント（`outputs/phase-1/main.md`）が `artifacts.json` の出力定義と一致する。
- [x] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない。
- [x] 受け入れ条件 4 項目（AC-1〜AC-4）が Phase 2 設計に直接マッピング可能な粒度になっている。

## 11. 後続 Phase への申し送り

- Phase 2 では本要件定義の AC-1〜AC-4 をそれぞれ独立セクションで設計する。
- 「skill symlink 撤去」「tmux session-scoped state」「gwt-auto lock」「shell state 分離」の 4 軸を設計の柱とする。
- NON_VISUAL evidence は Phase 11 手動テストで参照されるため、コマンド列を曖昧にしない。
