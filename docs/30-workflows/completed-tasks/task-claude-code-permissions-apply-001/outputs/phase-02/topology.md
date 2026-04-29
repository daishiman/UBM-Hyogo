# Phase 2 topology: 適用 topology / before-after diff

> 設計入力（再利用元・コピペではなくリンク参照）:
> - `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-2/settings-diff.md`
> - `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-2/alias-diff.md`
> - `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-2/whitelist-design.md`
> - `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §4（current canonical）

## 1. 書き換え対象 4 ファイル

| # | ファイル | 元設計の正本パス | 実機正本パス | 状態 |
| --- | --- | --- | --- | --- |
| F1 | global settings | `~/.claude/settings.json` | `~/.claude/settings.json` | 既存（編集対象） |
| F2 | globalLocal settings | `~/.claude/settings.local.json` | （未存在） | **作成しない**（変更を増やさない方針） |
| F3 | project settings | `<project>/.claude/settings.json` | 同左 | 既存（編集対象） |
| F4 | `cc` alias 定義 | `~/.zshrc` | `~/.config/zsh/conf.d/79-aliases-tools.zsh` | 既存（行 7 編集対象） |

## 2. F1: `~/.claude/settings.json` diff（E-1 global）

### Before（実機現状）

```jsonc
{
  "defaultMode": null,                          // root: 未設定
  "permissions": {
    "defaultMode": "bypassPermissions",         // nested: 既に bypass
    "additionalDirectories": [...],
    "allow": [/* 76 件 */],
    "deny": [/* 33 件 */],
    "ask": []
  },
  "env": {/* キー名のみ Phase 1 inventory 参照 */}
}
```

### After（適用方針: nested 維持・root には書き加えない）

```jsonc
{
  // root.defaultMode は書き加えない（論点 P-1: nested に統一）
  "permissions": {
    "defaultMode": "bypassPermissions",         // 変更なし（既に正値）
    /* 他キー変更なし */
  }
}
```

→ **F1 は実質 no-op**（既に望ましい状態）。本タスクでは backup のみ取得し JSON 編集は行わない判定が妥当。Phase 3 で再確認。

## 3. F3: `<project>/.claude/settings.json` diff（E-1 project + E-3 whitelist）

### Before（実機現状サマリ）

- `permissions.defaultMode` = `"bypassPermissions"` ✅
- `permissions.allow` = 139 件（広範。`Bash(curl *)`, `Edit(/Users/dm/...)`, `Bash(wrangler d1 *)` 等を含む）
- `permissions.deny` = 13 件（`Read(**/.env)`, `Bash(rm -rf /:*)`, `Bash(curl * | bash)` 等）
- `permissions.ask` = 3 件

### After 候補 (a): current canonical §4 を厳密採用

```jsonc
{
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm lint)",
      "Bash(pnpm test)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "deny": [
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(rm -rf /:*)",
      "Bash(curl * | sh:*)"
    ]
  }
}
```

### After 候補 (b): 既存維持 + §4 を minimum guarantee として追記（unioned）

- 既存 allow/deny に §4 の項目で **欠けているもののみ**追記
- 既存 deny の `Bash(curl * | bash)` は §4 の `Bash(curl * | sh:*)` と重複/補完なので両方残す

### whitelist-design.md と current canonical §4 の差分（重要・AC-2 必須記載）

| 項目 | whitelist-design.md（旧） | §4 current canonical | 差分種別 |
| --- | --- | --- | --- |
| allow パターン粒度 | 広範 glob（`Bash(pnpm *)`, `Read(*)`, `Edit(*)`, `Write(*)` 等） | 限定列挙（`Bash(pnpm install)` 等個別） | **粒度差: 旧は広い** |
| `Bash(mise *)` | allow に含む | 含まない | 旧のみ |
| `Bash(gh *)` | allow に含む | 含まない | 旧のみ |
| `Bash(bash scripts/cf.sh *)` | allow に含む | 含まない | 旧のみ |
| `Read(*)`, `Edit(*)`, `Write(*)` | allow に含む | 含まない（`Edit`/`Write` は Phase 10 MINOR 保留） | 旧のみ |
| `Bash(wrangler *)` | deny に含む | 含まない | 旧のみ |
| `Read(.env)` | deny に含む | 含まない（global 側で `Read(.env*)` で対応） | 旧のみ |
| `Bash(rm -rf /:*)` | `Bash(rm -rf /*)` | `Bash(rm -rf /:*)` | パターン記法差 |
| `Bash(curl * | sh:*)` | 含まない | 含む | §4 のみ |

→ 本タスクでは **採用候補 (b)（既存維持 + §4 minimum guarantee）** を Phase 3 推奨案とする。理由:
1. 既存 139 allow には CLAUDE.md ルール準拠の重要項目（`Bash(bash scripts/cf.sh *)` 相当の `mise`, `op` 等）が含まれ削除リスクが高い
2. §4 の deny 4 件はすべて既存 deny に既包含 or 補完関係
3. `Edit(*)` / `Write(*)` の whitelist 化は元タスクで「Phase 10 MINOR 保留」明記済み

## 4. F4: `~/.config/zsh/conf.d/79-aliases-tools.zsh` diff（E-2 alias）

### Before（行 6-7）

```zsh
# alias cc='claude --dangerously-skip-permissions --verbose'
alias cc='claude  --verbose --permission-mode bypassPermissions'
```

### After

```zsh
# alias cc='claude --dangerously-skip-permissions --verbose'    # 旧コメントは保持
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

差分:
- 連続スペース `claude  --verbose` → 単一スペース `claude --verbose`
- 末尾に `--dangerously-skip-permissions` を追加

`CC_ALIAS_EXPECTED` 環境変数（後続 Phase 4/5/11 検証用）:

```
CC_ALIAS_EXPECTED='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

> 補足: `type cc` が `/usr/bin/cc` を返す問題は本タスクでは編集のみ実施し、source 経路の調査は別タスクへ繰越（Phase 12 unassigned-task-detection 候補）。

## 5. backup 命名規則と保管場所

- 命名: `<original>.bak.<TS>` / `TS = $(date +%Y%m%d-%H%M%S)`
- 保管場所: 元ファイル同一ディレクトリ
- backup 対象（最大 3 ファイル。F2 は未存在のため取得不要）:
  - `~/.claude/settings.json.bak.<TS>`
  - `<project>/.claude/settings.json.bak.<TS>`
  - `~/.config/zsh/conf.d/79-aliases-tools.zsh.bak.<TS>`

## 6. ロールバック手順

実機書き換えは Phase 5 で別エージェントが実施するが、設計として固定:

```bash
TS=<記録済み TS>
# settings rollback
mv ~/.claude/settings.json.bak.${TS} ~/.claude/settings.json
mv "$PWD/.claude/settings.json.bak.${TS}" "$PWD/.claude/settings.json"
# alias rollback
mv ~/.config/zsh/conf.d/79-aliases-tools.zsh.bak.${TS} ~/.config/zsh/conf.d/79-aliases-tools.zsh
# shell reload
exec zsh -l
```

各ステップ失敗時の戻し先 backup ファイルは上記コマンドで原位置に戻す。

## 7. 設計入力との一致状況

- **元タスク `settings-diff.md` / `alias-diff.md`**: 行番号・ファイルパスは Phase 1 inventory に合わせて更新済（zshrc → conf.d/79-aliases-tools.zsh）
- **元タスク `whitelist-design.md`**: current canonical §4 と差分あり（本ファイル §3 に詳細）。Phase 3 R-4 の論点として持ち上げ
- **aiworkflow §4**: 採用候補 (b) で minimum guarantee として参照
