# Phase 2 validation-path: 検証パスと PASS 条件

> 検証カテゴリ 4 種: JSON validity / `defaultMode` 値 / alias 重複検出 / `type cc` 照合

## 1. JSON validity 検証

### コマンド

```bash
jq empty ~/.claude/settings.json
jq empty "$PWD/.claude/settings.json"
# 補助
python3 -m json.tool ~/.claude/settings.json >/dev/null
python3 -m json.tool "$PWD/.claude/settings.json" >/dev/null
```

### PASS 条件

- 全コマンドの exit code == 0
- 標準エラー出力が空
- backup から戻した場合も同様に PASS すること

## 2. `defaultMode` 値検証（nested 採用）

### コマンド

```bash
jq -r '.permissions.defaultMode' ~/.claude/settings.json
jq -r '.permissions.defaultMode' "$PWD/.claude/settings.json"
# 念のため root も確認（null であるべき）
jq -r '.defaultMode' ~/.claude/settings.json
jq -r '.defaultMode' "$PWD/.claude/settings.json"
```

### PASS 条件

- `.permissions.defaultMode` 出力 == `bypassPermissions`（両ファイル）
- `.defaultMode`（root）出力 == `null`（両ファイル）
- root と nested が両方非 null になることは禁止（parser 挙動依存を避ける）

## 3. alias 重複検出

### コマンド

```bash
grep -cE '^alias cc=' ~/.config/zsh/conf.d/79-aliases-tools.zsh
grep -cE '^alias cc=' ~/.zshrc 2>/dev/null
grep -rcE '^alias cc=' ~/.config/zsh/conf.d/ 2>/dev/null | awk -F: 'BEGIN{s=0} {s+=$2} END{print s}'
```

### PASS 条件

- `79-aliases-tools.zsh` でのヒット数 == 1（行 7、コメント行 6 はカウント外）
- `~/.zshrc` でのヒット数 == 0
- `~/.config/zsh/conf.d/` 配下総ヒット数 == 1

## 4. `type cc` 照合

### コマンド

```bash
# 新規 zsh -l で source を反映させた後に
exec zsh -l
type cc
echo "$CC_ALIAS_EXPECTED"
```

### 期待文字列

```
cc is an alias for claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions
```

### PASS 条件

- `type cc` 出力に `claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` が含まれる
- `type cc` が `/usr/bin/cc` を返さない（**Phase 1 現状の `/usr/bin/cc` から変化していること**が必須）

> 注: source されない問題が解消されない場合、本タスクの実装 Phase（5）で「`79-aliases-tools.zsh` を `~/.zshrc` から source する記述があるか」を確認するステップを runbook 追加候補に挙げる。

## 5. 検証実行順序（Phase 5 で別エージェントが実行）

```
[1] backup 取得
  ↓
[2] settings 編集（global → project）
  ↓
[3] §1 JSON validity（両ファイル）── FAIL なら rollback
  ↓
[4] §2 defaultMode 値（両ファイル）── FAIL なら rollback
  ↓
[5] alias 編集（79-aliases-tools.zsh:7）
  ↓
[6] §3 alias 重複検出 ── FAIL なら rollback
  ↓
[7] shell reload (`exec zsh -l`)
  ↓
[8] §4 type cc 照合 ── FAIL なら rollback
  ↓
[9] smoke (TC-01〜TC-04 / TC-F-01〜TC-F-02 / TC-R-01)
  ↓
[10] TC-05（前提タスク #1 未完なら BLOCKED として記録、PASS/FAIL 判定スキップ）
```

## 6. 各検証コマンドのトレーサビリティ

| 検証 ID | 対応 AC | 対応 TC | コマンド |
| --- | --- | --- | --- |
| V-1 | AC-4 | TC-R-01 | `ls *.bak.<TS>` + `wc -c` 比較 |
| V-2 | AC-1 | TC-01 | `jq -r '.permissions.defaultMode' <file>` |
| V-3 | AC-1 | TC-02 | JSON validity (`jq empty`) |
| V-4 | AC-3 | TC-03 | `grep -cE '^alias cc=' <正本>` == 1 |
| V-5 | AC-3 | TC-04 | `type cc` の expected 一致 |
| V-6 | AC-2 | TC-F-01 | `jq '.permissions.allow' / '.permissions.deny'` の §4 minimum 包含確認 |
| V-7 | AC-5 | TC-05 | bypass 下 deny 実効性（前提タスク #1 未完 → **BLOCKED** 記録） |
| V-8 | AC-6 | TC-F-02 | rollback 実行ログ |
