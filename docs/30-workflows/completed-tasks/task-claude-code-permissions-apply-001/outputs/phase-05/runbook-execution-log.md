# Phase 5 runbook-execution-log: 実行ログ（host 環境反映）

## TS（sticky）

```
TS=20260428-192736
```

## Step 1: backup 取得

```bash
TS=$(date +%Y%m%d-%H%M%S)   # = 20260428-192736
cp -p ~/.claude/settings.json ~/.claude/settings.json.bak.$TS
cp -p "$PROJ/.claude/settings.json" "$PROJ/.claude/settings.json.bak.$TS"
cp -p ~/.config/zsh/conf.d/79-aliases-tools.zsh ~/.config/zsh/conf.d/79-aliases-tools.zsh.bak.$TS
cp -p ~/.zshrc ~/.zshrc.bak.$TS
```

stdout:
```
[OK] global
[OK] project
[OK] alias
[OK] zshrc
```

サイズ一致は backup-manifest.md 参照。

## Step 2: グローバル settings 反映

### `~/.claude/settings.json`

```bash
jq -r '.permissions.defaultMode' ~/.claude/settings.json
# → bypassPermissions （既に正値）
```

判定: **no-op**（jq での編集は実施せず、backup のみ取得して保全）

### `~/.claude/settings.local.json`

```bash
ls ~/.claude/settings.local.json
# ls: No such file or directory
```

判定: **N/A**（不在維持・作成しない設計方針）

### JSON validity 検証

```bash
jq empty ~/.claude/settings.json && echo PASS
# → PASS
```

## Step 3: project whitelist 反映

```bash
PROJ="/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json"
jq '.permissions.allow = ((.permissions.allow + [
      "Bash(pnpm install)","Bash(pnpm typecheck)","Bash(pnpm lint)","Bash(pnpm test)",
      "Bash(git status)","Bash(git diff:*)","Bash(git log:*)"
   ]) | unique) |
   .permissions.deny = ((.permissions.deny + [
      "Bash(git push --force:*)","Bash(git push -f:*)","Bash(rm -rf /:*)","Bash(curl * | sh:*)"
   ]) | unique)' "$PROJ" > /tmp/proj_new.json
jq empty /tmp/proj_new.json
mv /tmp/proj_new.json "$PROJ"
```

stdout:
```
allow count: 139 → 146 (+7)
deny count:  13 → 16 (+3)
defaultMode: bypassPermissions（変更なし）
```

§4 minimum guarantee 包含確認: allow 7/7、deny 4/4 すべて [OK]。

## Step 4: alias 反映

### `~/.config/zsh/conf.d/79-aliases-tools.zsh:7`

Before:
```zsh
alias cc='claude  --verbose --permission-mode bypassPermissions'
```

After:
```zsh
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

検証:
```bash
grep -cE '^alias cc=' ~/.config/zsh/conf.d/79-aliases-tools.zsh
# → 1
zsh -i -c 'type cc'
# → cc is an alias for claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions
```

### `~/.zshrc` conf.d source 追記（idempotent 判定）

```bash
grep -nE 'conf\.d/79-aliases-tools|conf\.d/\*\.zsh' ~/.zshrc
# → 25:source ~/.config/zsh/conf.d/79-aliases-tools.zsh
```

判定: **追記不要・no-op**（line 25 で個別 source 済、`cc` alias は新シェルで効く）

## Step 5: smoke テスト

| TC | コマンド | 結果 |
| --- | --- | --- |
| TC-01 | `jq -r '.permissions.defaultMode' ~/.claude/settings.json` | `bypassPermissions` → PASS |
| TC-02 | `test -f ~/.claude/settings.local.json` | 不在 → N/A (PASS) |
| TC-03 | §4 allow 7件 / deny 4件 grep | 全 [OK] → PASS |
| TC-04 | `grep -nE '^alias cc=' ALIAS_FILE` + `zsh -i -c 'type cc'` | 期待値完全一致 → PASS |
| TC-05 | （前提タスク未完） | BLOCKED |
| TC-R-01 | `grep -rcE '^alias cc=' ~/.zshrc ~/.zshenv ~/.zprofile ~/.config/zsh` | total=2（うち 1 件は backup ファイル `.bak.20260428-192736`）→ Phase 6 guard で backup 除外する補正を記録 |

## Step 6: rollback 手順（記録のみ・実行はしない）

```bash
TS=20260428-192736
PROJ="/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json"

# project settings rollback
cp -p "$PROJ.bak.$TS" "$PROJ"

# alias rollback
cp -p ~/.config/zsh/conf.d/79-aliases-tools.zsh.bak.$TS ~/.config/zsh/conf.d/79-aliases-tools.zsh

# global settings rollback（本タスクでは no-op だが backup 復元手順として記録）
cp -p ~/.claude/settings.json.bak.$TS ~/.claude/settings.json

# zshrc rollback（本タスクでは no-op）
cp -p ~/.zshrc.bak.$TS ~/.zshrc

# shell reload
exec zsh -l
```

## 不変条件チェック

- [x] 平文 `.env` / API token / OAuth token を本ログに転記していない
- [x] `wrangler` 直接実行なし
- [x] `~/Library/Preferences/.wrangler/config/default.toml` 新規生成なし
- [x] backup を書き換え前に取得済
- [x] jq の in-place は temp ファイル経由（原子性確保）
- [x] 各書き換え後に `jq empty` PASS
