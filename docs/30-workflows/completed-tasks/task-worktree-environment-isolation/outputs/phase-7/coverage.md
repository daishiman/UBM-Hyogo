# coverage — task-worktree-environment-isolation

## 0. 評価方針

本タスクは **docs-only / spec_created / NON_VISUAL** であり、ソースコードの増減を伴わない。
したがって行カバレッジ・分岐カバレッジは評価対象外とし、以下の「仕様網羅率」で評価する。

| 軸 | 内容 |
| --- | --- |
| AC 網羅 | Phase 1 で定義した受け入れ条件 AC-1〜AC-4 が、設計（D-1〜D-4）・証跡（EV-1〜EV-7）・失敗ケース（F-1〜F-6）にマップされているか |
| EV 取得計画 | Phase 2 §6 の証跡 EV-1〜EV-7 が Phase 11 手動テストで全件実行可能か |
| 失敗ケース網羅 | Phase 1/2 のリスク表の全項目が Phase 6 failure case に対応しているか |
| 不変条件遵守 | CLAUDE.md「重要な不変条件」に矛盾する記述が成果物にないか |

---

## 1. AC × テストケース 網羅マトリクス

| AC | 設計決定 | 正常系証跡 | 失敗ケース | 仕様網羅 |
| --- | --- | --- | --- | --- |
| AC-1 skill symlink 撤去方針 | D-1（Phase 2 §1） | EV-1 | F-4 | ✅ |
| AC-2 tmux session-scoped state | D-2（Phase 2 §2） | EV-2, EV-3 | F-3 | ✅ |
| AC-3 gwt-auto lock | D-3（Phase 2 §3, §5） | EV-4, EV-5 | F-1, F-2, F-6 | ✅ |
| AC-4 NON_VISUAL evidence 取得手順 | D-5（Phase 2 §6） | EV-1〜EV-7 全件 | F-5（環境前提） | ✅ |
| 横断 shell state 分離 | D-4（Phase 2 §4） | EV-7 | F-5 | ✅ |

すべての AC に **設計 / 正常系 / 失敗ケース**の三点セットが揃っている。

---

## 2. EV-1〜EV-7 取得計画との対応

| EV | 取得コマンド | 取得 Phase | 対応 AC | 対応 F |
| --- | --- | --- | --- | --- |
| EV-1 skill symlink ゼロ | `find .claude/skills -type l \| wc -l` | Phase 11 | AC-1 | F-4 |
| EV-2 tmux global にリーク無し | `tmux show-environment -g \| grep -E '^UBM_WT_' \|\| true` | Phase 11 | AC-2 | F-3 |
| EV-3 tmux session-scope 注入 | `tmux show-environment -t ubm-<slug> \| grep -E '^UBM_WT_' \| wc -l` | Phase 11 | AC-2 | F-3 |
| EV-4 lock 競合即時失敗 | `bash scripts/new-worktree.sh feat/x` 2 ターミナル同時 | Phase 11 | AC-3 | F-1, F-6 |
| EV-5 lock メタ情報 | `cat .worktrees/.locks/<slug>.lockdir/owner` | Phase 11 | AC-3 | F-2, F-6 |
| EV-6 worktree 作成成功 | `git worktree list` | Phase 11 | AC-3, AC-4 | （正常系のみ） |
| EV-7 mise バージョン | `mise exec -- node --version` | Phase 11 | AC-4 | F-5 |

EV は 7 件全件、AC と F の双方に紐付き済み。Phase 11 で漏れなく取得可能。

---

## 3. 失敗ケース網羅状況

| 失敗ケース | 元リスク | カバー手段 |
| --- | --- | --- |
| F-1 flock 不在環境 | macOS に flock(1) なし | mkdir フォールバック（Phase 2 §3.5） |
| F-2 日本語パス | `個人開発` を含むパス | ASCII slug（Phase 2 §3.1） |
| F-3 tmux 多重 attach | global env 汚染 | session-scoped `-e` 注入（Phase 2 §2.2-4） |
| F-4 既存 symlink 残存 | 過去の手作業 symlink | インベントリ → 撤去（Phase 2 §1.2） |
| F-5 mise install 未実施 | 直叩き worktree | `scripts/new-worktree.sh` 経由を強制（runbook） |
| F-6 lock 取得失敗 | 並列実行衝突 | flock -n / mkdir 即時失敗（Phase 2 §3.2） |

---

## 4. 未カバー領域の洗い出しと判定

| 未カバー領域 | 理由 | 判定 |
| --- | --- | --- |
| NFS 上の lock ファイル孤児化 | NFS は `flock` の挙動が不安定 | **許容**: Phase 2 §7 で「NFS 想定外、ローカルのみサポート」と runbook 明記 |
| Linux / WSL 等 macOS 以外 | 本リポジトリは macOS 開発前提 | **許容**: 環境変数管理が異なるが本タスクスコープ外 |
| Claude Code 起動前の `OP_SERVICE_ACCOUNT_TOKEN` リーク | 親シェル由来のトークン伝播 | **許容**: 別タスク `task-claude-code-permissions-decisive-mode` に申し送り（Phase 2 §4.2） |
| skill 個別の差分検知（symlink 以外の汚染） | 後続タスクで lefthook が処理 | **許容**: `task-git-hooks-lefthook-and-post-merge` に申し送り |
| tmux ユーザー以外の代替手段（screen / iTerm split） | tmux は opt-in（`--with-tmux`） | **許容**: フラグなし運用は影響を受けない |

未カバー領域はすべて「許容」もしくは「別タスク申し送り」で処理されており、**本タスク内で追加すべき領域はない**。

---

## 5. 不変条件遵守チェック

| 不変条件（CLAUDE.md） | 違反箇所 | 状態 |
| --- | --- | --- |
| D1 直接アクセスは apps/api に閉じる | docs に D1 言及なし | ✅ |
| 平文 .env をコミットしない | lock ファイル/session-state に secret を書かない（Phase 2 §3.2） | ✅ |
| `wrangler` 直接実行禁止 | docs サンプルは scripts/cf.sh 経由のみ | ✅ |
| GAS prototype に依存しない | 言及なし | ✅ |
| 承認前の commit / push / PR 禁止 | Phase 13 まで pending、Phase 6/7 でも禁止遵守 | ✅ |

---

## 6. 結論

- 仕様網羅率: **AC-1〜AC-4 を 100% カバー**。
- EV-1〜EV-7 は Phase 11 で全件取得計画あり。
- 失敗ケース F-1〜F-6 はリスク表に対応。
- 未カバー領域はすべて明示除外または別タスク申し送り。
- **追加テスト・追加 failure case は不要**と判定。Phase 8 リファクタリングへ進める。
