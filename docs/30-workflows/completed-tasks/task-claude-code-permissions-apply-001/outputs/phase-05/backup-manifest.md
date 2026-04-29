# Phase 5 backup-manifest: 取得済 backup 一覧

## TS

```
TS=20260428-192736
```

## backup 4 件

| # | 絶対パス | サイズ (bytes) | sha256 (先頭 16 桁) | 元ファイルとサイズ一致 |
| --- | --- | --- | --- | --- |
| B1 | `/Users/dm/.claude/settings.json.bak.20260428-192736` | 4711 | `714c12e9534c6ca1` | ✅ (元 4711) |
| B2 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json.bak.20260428-192736` | 6134 | `98e52b1fb1de4164` | ✅ (元 6134、Step 3 で更新前のサイズ) |
| B3 | `/Users/dm/.config/zsh/conf.d/79-aliases-tools.zsh.bak.20260428-192736` | 1462 | `c8ea14c47e71725e` | ✅ (元 1462、Step 4 で更新前のサイズ) |
| B4 | `/Users/dm/.zshrc.bak.20260428-192736` | 1417 | `249076b45d5e7b8b` | ✅ (元 1417) |

## 命名規則

- `<original>.bak.<TS>` 固定（`BACKUP_SUFFIX_PATTERN='\.bak\.[0-9]{8}-[0-9]{6}$'`）
- TS は sticky 固定 = 全 backup で同一値

## 取得検証コマンド

```bash
TS=20260428-192736
ls -1 \
  ~/.claude/settings.json.bak.$TS \
  "/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json.bak.$TS" \
  ~/.config/zsh/conf.d/79-aliases-tools.zsh.bak.$TS \
  ~/.zshrc.bak.$TS
```

## 注記

- B1 / B4 は Phase 5 で **元ファイルを変更していない**（no-op）が、設計上 4 ファイルの backup を揃える方針のため取得済
- B2 / B3 は Phase 5 で更新済の元ファイルの **書き換え前 snapshot**
- 平文シークレットや API token は backup 内に**含まれていない**ことを目視確認済（`~/.claude/settings.json` の `env` セクションは Claude Code 標準環境変数のみ）
