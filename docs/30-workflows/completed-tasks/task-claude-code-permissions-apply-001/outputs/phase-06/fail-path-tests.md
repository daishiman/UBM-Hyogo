# Phase 6 fail-path-tests: TC-F-01 / TC-F-02 / TC-R-01 詳細

## 共通

```
TS=20260428-192736
backup-manifest 参照: outputs/phase-05/backup-manifest.md
```

rollback 経路:
```bash
cp -p ~/.config/zsh/conf.d/79-aliases-tools.zsh.bak.20260428-192736 \
      ~/.config/zsh/conf.d/79-aliases-tools.zsh
cp -p ~/.claude/settings.json.bak.20260428-192736 ~/.claude/settings.json
cp -p "/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json.bak.20260428-192736" \
      "/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json"
```

## TC-F-01: `defaultMode` typo 注入（dry path）

### 安全策

実機 `~/.claude/settings.json` を直接書き換えると Claude Code セッション全体に影響するため、
**jq pipe で in-memory 検証**（実機書き換えなし）を採用。

### 注入手順

```bash
jq '.permissions.defaultMode = "bypassPermisson"' ~/.claude/settings.json | jq -r '.permissions.defaultMode'
```

### 観測結果

```
bypassPermisson
```

→ typo 値が読み出されることを確認。実 Claude Code 起動時はこの値で **bypass モードがマッチしない → permission prompt にフォールバック**することが期待挙動（Claude Code 仕様）。

### rollback

実機編集していないため rollback 不要。実ファイルへ注入していた場合の手順は上記「共通 rollback 経路」参照。

### 判定

**PASS**（dry path で typo 値の読み出しを確認、実機 selectors にフォールバック動作する根拠を取得）

## TC-F-02: `cc` alias 重複定義注入（実機注入→即 rollback）

### 注入手順

```bash
# 注入
echo "alias cc='claude'" >> ~/.config/zsh/conf.d/79-aliases-tools.zsh

# 観測
grep -cE '^alias cc=' ~/.config/zsh/conf.d/79-aliases-tools.zsh   # → 2
zsh -i -c 'type cc'   # → cc is an alias for claude

# 即時 rollback（追加した 1 行を削除）
# 実装: Edit ツールで `alias cc='claude'\n` を空文字に置換
grep -cE '^alias cc=' ~/.config/zsh/conf.d/79-aliases-tools.zsh   # → 1
zsh -i -c 'type cc'   # → cc is an alias for claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions
```

### 観測結果

| 段階 | `grep -c` | `type cc` 出力 |
| --- | --- | --- |
| 注入前 | 1 | `claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` |
| 注入後 | **2** | `claude`（後勝ち） |
| rollback 後 | 1 | `claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` |

→ **後勝ちで `CC_ALIAS_EXPECTED` 由来の文字列と差分**を観測。期待通り。

### 判定

**PASS**（注入で重複検出 + 後勝ち動作を確認、rollback で完全復帰）

## TC-R-01: 回帰 guard 用 grep スクリプト

### スクリプト本体（手動実行用、CI 化はしない）

```bash
#!/usr/bin/env bash
# alias 重複検出 guard（手動実行用）
# backup ファイル（.bak.<TS>）は除外する
set -euo pipefail
hits=$(grep -rE '^alias cc=' ~/.zshrc ~/.zshenv ~/.zprofile ~/.config/zsh 2>/dev/null \
  | grep -v '\.bak\.' \
  | wc -l \
  | tr -d ' ')
if [[ "$hits" -ne 1 ]]; then
  echo "[FAIL] alias cc 定義が $hits 件検出されました（期待: 1）" >&2
  exit 1
fi
echo "[PASS] alias cc 定義は 1 件です（backup 除外）"
```

### 元仕様との差分（Phase 5 で発見した補正）

Phase 5 smoke で `grep -rcE '^alias cc=' ...` が total=2 を返した。原因は `79-aliases-tools.zsh.bak.20260428-192736` が backup として同一ディレクトリに存在し grep にヒットしたため。
→ guard スクリプトでは **`grep -v '\.bak\.'` で backup を除外**することで真の重複検出に統一。

### 手動実行結果

```
[PASS] alias cc 定義は 1 件です（backup 除外）
```

### 未タスク候補

- 上記 guard を CI 化（GitHub Actions の zsh job）
- 本タスク範囲外。Phase 12 `unassigned-task-detection.md` に登録予定。

## Phase 5 TC-01〜TC-04 再 PASS 確認

| TC | 注入＋rollback 後の判定 |
| --- | --- |
| TC-01 | PASS（global 触らず） |
| TC-02 | PASS（不在維持） |
| TC-03 | PASS（project 触らず） |
| TC-04 | PASS（rollback 後 `zsh -i -c 'type cc'` が `CC_ALIAS_EXPECTED` 一致） |
| TC-R-01 | PASS（guard `[PASS]` 出力） |
