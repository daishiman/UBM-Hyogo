# Phase 5: 実装ランブック（別タスク向け）

> 実行担当者向けの **手順書**。本タスク（spec_created）では書き換えを行わない。
> `<USER>` はマシンユーザー名のプレースホルダ。実行時に置換すること。

## 前提チェック

```bash
# 現在の Claude Code バージョン
claude --version

# 現行 alias 定義の場所を特定（重要: 編集対象ファイルの確定）
grep -rn "alias cc=" ~/.zshrc ~/.config/zsh/ 2>/dev/null

# settings 3 層の存在確認
ls -la ~/.claude/settings.json ~/.claude/settings.local.json
ls -la "$(pwd)/.claude/settings.json"
```

期待: alias 定義ファイルが 1 箇所に特定できること。複数ヒットした場合は Step 4 を保留し、優先順位を確認する。

## Step 1: バックアップ取得

```bash
TS=$(date +%Y%m%d%H%M%S)
cp ~/.claude/settings.json        ~/.claude/settings.json.bak.${TS}
cp ~/.claude/settings.local.json  ~/.claude/settings.local.json.bak.${TS}
cp "$(pwd)/.claude/settings.json" "$(pwd)/.claude/settings.json.bak.${TS}"
cp ~/.zshrc                       ~/.zshrc.bak.${TS}

echo "BACKUP TS=${TS}"  # ロールバック時に必要なので記録
```

検証:

```bash
ls -la ~/.claude/*.bak.${TS} ~/.zshrc.bak.${TS}
```

## Step 2: グローバル settings の `defaultMode` 統一

対象: `~/.claude/settings.json`（採用案 A）

操作:

- `"defaultMode": "acceptEdits"` を `"defaultMode": "bypassPermissions"` に変更
- 編集は任意のテキストエディタ。`sed -i` を使う場合は macOS 互換に注意

JSON validity 検証（`<USER>` を実値に置換）:

```bash
node -e "JSON.parse(require('fs').readFileSync('/Users/<USER>/.claude/settings.json','utf8')); console.log('OK')"
node -e "JSON.parse(require('fs').readFileSync('/Users/<USER>/.claude/settings.local.json','utf8')); console.log('OK')"
```

期待: 両方とも `OK` が出力される。

## Step 3: プロジェクト settings の whitelist 更新

対象: `<project>/.claude/settings.json`

操作:

- `permissions.allow` / `permissions.deny` を Phase 2 `outputs/phase-2/whitelist-design.md` 通りに更新
- `defaultMode` は既に `bypassPermissions` であるため変更不要（Phase 1 で確認済み）

JSON validity 検証:

```bash
node -e "JSON.parse(require('fs').readFileSync('$(pwd)/.claude/settings.json','utf8')); console.log('OK')"
```

## Step 4: `cc` alias 書き換え

前提チェックの grep で特定したファイルのみを編集。

```diff
# Before
- alias cc='claude --verbose --permission-mode bypassPermissions'

# After
+ alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

反映:

```bash
# 編集対象が ~/.zshrc の場合
source ~/.zshrc

# 編集対象が ~/.config/zsh/conf.d/<n>-claude.zsh の場合
source ~/.config/zsh/conf.d/<n>-claude.zsh
# あるいは新しいタブを開く
```

確認:

```bash
type cc
# 期待: cc is an alias for claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions
```

## Step 5: 動作確認（TC-01〜TC-05）

`outputs/phase-4/test-scenarios.md` の TC-01〜TC-05 を順次実行する。

```bash
# TC-01: 新規タブで cc 起動
cc

# TC-02: session 内 /exit → 再起動
# TC-03: 別プロジェクトディレクトリへ cd して cc
# TC-04 / TC-05: 一時的に bypass 外しコマンドで起動して whitelist 検証
```

判定結果は `outputs/phase-11/manual-smoke-log.md` に記録する。

## Step 6: ロールバック手順（失敗時）

Step 1 で記録した `${TS}` を使用。

```bash
TS=<記録した値>
cp ~/.claude/settings.json.bak.${TS}        ~/.claude/settings.json
cp ~/.claude/settings.local.json.bak.${TS}  ~/.claude/settings.local.json
cp "$(pwd)/.claude/settings.json.bak.${TS}" "$(pwd)/.claude/settings.json"
cp ~/.zshrc.bak.${TS}                       ~/.zshrc
source ~/.zshrc
```

検証:

```bash
node -e "JSON.parse(require('fs').readFileSync('/Users/<USER>/.claude/settings.json','utf8')); console.log('OK')"
type cc
```

期待: 旧 alias / 旧 settings に戻っており、claude が以前と同じモードで起動する。

## 安全ガード

| 項目 | ガード |
| --- | --- |
| secrets 流出 | 本ランブックに API token / OAuth 値を一切含めない |
| 実 ref への push | TC-05 では `--dry-run` + dummy ref のみ |
| 他プロジェクト波及 | グローバル settings 編集後、Phase 3 impact-analysis.md の波及項目を再確認 |
| JSON 破壊 | 各 Step で `node -e "JSON.parse(...)"` 検証必須 |
| alias 重複 | 前提チェックの grep が複数ヒットした場合は実装中断 |

## 参照

- Phase 2 設計: `outputs/phase-2/{settings-diff,alias-diff,whitelist-design}.md`
- Phase 3 影響分析: `outputs/phase-3/impact-analysis.md`
- Phase 4 テスト: `outputs/phase-4/test-scenarios.md`
- 仕様: `phase-05.md`
