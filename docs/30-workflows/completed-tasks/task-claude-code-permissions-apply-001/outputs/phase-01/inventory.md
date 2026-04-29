# Phase 1 inventory: 実機現値の棚卸し

> 取得日: 2026-04-28 / `cat` 全文取得は禁止（`jq` でキー名・キー値のみ抽出）。`env` 配下は **キー名のみ**記録。

## 1. Claude Code バージョン

```
$ claude --version
2.1.62 (Claude Code)
```

## 2. 3 層 settings の現値

### 2.1 `~/.claude/settings.json`（global）

| キー | 値 |
| --- | --- |
| `defaultMode`（root） | `null`（未設定） |
| `permissions.defaultMode` | `"bypassPermissions"` |
| `permissions.additionalDirectories` | `["~/.config/nvim", "~/.local/share/nvim"]` |
| `permissions.allow.length` | 76 |
| `permissions.deny.length` | 33 |
| `permissions.ask.length` | 0 |
| `env` キー名 | `BASH_DEFAULT_TIMEOUT_MS`, `CLAUDE_CODE_DISABLE_1M_CONTEXT`, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `DISABLE_NON_ESSENTIAL_MODEL_CALLS`, `DISABLE_TELEMETRY`, `EDITOR`, `MAX_THINKING_TOKENS`, `VISUAL`（**値は記録しない**） |

> **重要**: 元タスクの設計入力は「`defaultMode` を root に置く」前提だが、現状は `permissions.defaultMode` 配下に既に `bypassPermissions` が設定されている。両方が併存可能か / どちらが優先されるかは Phase 2 で aiworkflow §1（上位優先・上書き）に照らして判定（論点 P-1）。

### 2.2 `~/.claude/settings.local.json`（globalLocal）

- **存在しない** (`ls: No such file or directory`)
- → 設計入力どおり global と project の 2 層で構成。globalLocal は本タスクで新規作成しない（追加変更を増やさない）

### 2.3 `<project>/.claude/settings.json`（project: 現 worktree）

パス: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json`

| キー | 値 |
| --- | --- |
| `defaultMode`（root） | `null` |
| `permissions.defaultMode` | `"bypassPermissions"` |
| `permissions.allow.length` | 139 |
| `permissions.deny.length` | 13 |
| `permissions.ask.length` | 3（`Bash(rm -rf:*)`, `Bash(sudo:*)`, `Bash(chown:*)`） |
| `env` キー名 | （なし） |

> 既存 allow/deny は current canonical §4（簡潔な 7 + 4 件）と乖離が大きい。Phase 2 で diff を topology.md に展開し、Phase 3 で衝突解消方針を確定。

### 2.4 `<project>/.claude/settings.local.json`（projectLocal）

- **存在しない**

## 3. `cc` alias 現値

```
$ type cc
cc is /usr/bin/cc
```

→ **`cc` は alias として未定義**（C コンパイラ `/usr/bin/cc` に解決される）。シェル起動時点で alias が読まれていない。

### 3.1 alias 定義の grep 結果

```
$ grep -nE '^alias cc=' ~/.zshrc ~/.config/zsh/conf.d/*-claude.zsh 2>/dev/null
（マッチなし）

$ grep -rnE 'alias cc=|claude --' ~/.zshrc ~/.zshenv ~/.zprofile ~/.config/zsh/conf.d/
/Users/dm/.config/zsh/conf.d/79-aliases-tools.zsh:6:# alias cc='claude --dangerously-skip-permissions --verbose'
/Users/dm/.config/zsh/conf.d/79-aliases-tools.zsh:7:alias cc='claude  --verbose --permission-mode bypassPermissions'
/Users/dm/.config/zsh/conf.d/73-git-worktree.zsh:253:exec claude --verbose --permission-mode bypassPermissions "$@"
/Users/dm/.config/zsh/conf.d/73-git-worktree.zsh:266:  echo "  cd ${worktree_path} && claude --verbose --permission-mode bypassPermissions"
```

### 3.2 正本ファイル断定

- **正本**: `~/.config/zsh/conf.d/79-aliases-tools.zsh:7`（`alias cc='claude  --verbose --permission-mode bypassPermissions'`）
- 元設計の前提（`~/.zshrc`）と異なる → Phase 2 topology.md / Phase 3 R-5 で正本パス差し替えを記録
- 6 行目はコメントアウト済み旧定義、7 行目が現 effective 定義
- `73-git-worktree.zsh` は worktree 起動ヘルパで関連だが alias ではない（Phase 2 では参照のみ）
- `type cc` が `/usr/bin/cc` を返す原因は **未調査**（Phase 1 棚卸しの範囲外）。考えられる仮説: 当該 zsh ファイルが現在の shell session で source されていない / `unalias cc` が後段で発火 / interactive shell でのみ source される

### 3.3 期待値（CC_ALIAS_EXPECTED）

```
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

差分: Before 行 7 はスペース 2 個 (`claude  --verbose`) と `--dangerously-skip-permissions` 未付与。

## 4. 他 project 影響範囲（`defaultMode` override 走査）

`find ~/.claude ~/dev -name 'settings*.json'` 配下から `defaultMode`（root） / `permissions.defaultMode` を抽出した結果（実値も非機密のため記録）:

| パス | root.defaultMode | permissions.defaultMode | 評価 |
| --- | --- | --- | --- |
| `~/.claude/settings.json` | null | `bypassPermissions` | global 本体（本タスク対象） |
| `~/dev/dev/個人開発/AutoForgeNexus/.claude/settings.json` | null | `acceptEdits` | 他 project（明示 override） |
| `~/dev/dev/個人開発/AutoForgeNexus/.claude/settings.local.json` | null | `acceptEdits` | 他 project（明示 override） |
| `~/dev/dev/個人開発/Skill/.claude/settings.json` | null | null | 未定義（global 継承） |
| `~/dev/dev/個人開発/Skill/.claude/settings.local.json` | null | null | 未定義 |
| `~/dev/dev/個人開発/AIWorkflowOrchestrator/.claude/settings.local.json` | null | null | 未定義 |
| `~/dev/dev/個人開発/senpAI/.claude/settings.local.json` | null | null | 未定義 |
| `~/dev/dev/個人開発/UBM-Hyogo/.claude/settings.json` | null | `bypassPermissions` | 本リポジトリ main worktree |
| `~/dev/dev/個人開発/UBM-Hyogo/.claude/settings.local.json` | null | null | 未定義 |
| `~/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json` | null | `bypassPermissions` | 本タスク worktree（対象） |
| `~/dev/dev/n8n/.claude/settings.json` | null | null | 未定義 |
| `~/dev/dev/n8n/.claude/settings.local.json` | null | null | 未定義 |
| `~/dev/dev/ObsidianMemo/.claude/settings.json` | null | `bypassPermissions` | 他 project（既に bypass） |

### 4.1 波及評価サマリ

- **global の `permissions.defaultMode` を `bypassPermissions` に変えても**、他 project で明示 override しているのは AutoForgeNexus（`acceptEdits`）の 1 ファミリのみ → AutoForgeNexus は project 層が上位に勝つため影響なし
- **未定義（null）の他 project**（Skill / AIWorkflowOrchestrator / senpAI / n8n）は global 継承で **bypass 化される**副作用あり
- 既に bypass のもの（ObsidianMemo / UBM-Hyogo 系）は変化なし

## 5. 必須前提タスクの完了状況

| タスクID | 指示書 | outputs/ 実成果物 | 判定 |
| --- | --- | --- | --- |
| `task-claude-code-permissions-deny-bypass-verification-001` | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001.md`（指示書のみ） | 無し | **未実施** |
| `task-claude-code-permissions-project-local-first-comparison-001` | `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md`（指示書のみ） | 無し | **未実施** |
| `task-claude-code-permissions-decisive-mode` | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/` 完備 | phase-2 / phase-5 / phase-12 揃う | 完了（設計入力として利用可） |

→ 必須前提 2 件は完了仕様書（outputs/ 配下の検証ログ）が **存在しない**。指示書ファイル名が `completed-tasks/` 直下に置かれているが、実体は未実施。
