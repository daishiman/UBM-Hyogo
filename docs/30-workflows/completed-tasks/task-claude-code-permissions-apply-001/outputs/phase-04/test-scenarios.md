# Phase 4 test-scenarios: 8 TC の前提・実行コマンド・期待出力・Pass 判定

## 共通変数

```
PROJECT_DIR=/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8
ALIAS_FILE=~/.config/zsh/conf.d/79-aliases-tools.zsh
```

## TC-01: global `~/.claude/settings.json` の `permissions.defaultMode`

| 項目 | 内容 |
| --- | --- |
| 前提 | `~/.claude/settings.json` 存在 + JSON valid |
| 実行 | `jq -r '.permissions.defaultMode' ~/.claude/settings.json` |
| 期待出力 | `bypassPermissions` |
| Pass 判定 | 出力が `DEFAULT_MODE_EXPECTED` と完全一致 |
| Red 状態 (Phase 5 前) | **PASS**（既に正値・実機 inventory より） |

## TC-02: globalLocal `~/.claude/settings.local.json`

| 項目 | 内容 |
| --- | --- |
| 前提 | 本タスクでは globalLocal を **作成しない**方針 |
| 実行 | `test -f ~/.claude/settings.local.json && jq -r '.permissions.defaultMode' ~/.claude/settings.local.json \|\| echo "N/A: not present"` |
| 期待出力 | `N/A: not present` |
| Pass 判定 | ファイル不在を確認（変更を増やさない） |
| Red 状態 (Phase 5 前) | **PASS**（不在維持） |

## TC-03: project `<project>/.claude/settings.json` の `permissions.allow` / `deny`

| 項目 | 内容 |
| --- | --- |
| 前提 | `<project>/.claude/settings.json` 存在 + JSON valid |
| 実行 (allow) | `jq -r '.permissions.allow[]' "$PROJECT_DIR/.claude/settings.json" \| sort -u > /tmp/allow.txt && for v in 'Bash(pnpm install)' 'Bash(pnpm typecheck)' 'Bash(pnpm lint)' 'Bash(pnpm test)' 'Bash(git status)' 'Bash(git diff:*)' 'Bash(git log:*)'; do grep -Fxq "$v" /tmp/allow.txt \|\| echo "MISS: $v"; done` |
| 実行 (deny) | 同様に §4 deny 4 件で grep |
| 期待出力 | `MISS:` 行 0 件（§4 minimum guarantee 完全包含） |
| Pass 判定 | allow 7件 + deny 4件すべて grep ヒット（既存項目は維持されていること） |
| Red 状態 (Phase 5 前) | **FAIL**（allow 7件・deny 3件が未包含） |

## TC-04: `cc` alias 正準化

| 項目 | 内容 |
| --- | --- |
| 前提 | `~/.config/zsh/conf.d/79-aliases-tools.zsh` 存在 |
| 実行 (定義) | `grep -nE "^alias cc=" $ALIAS_FILE` |
| 実行 (重複) | `grep -cE "^alias cc=" $ALIAS_FILE` |
| 実行 (実効) | `zsh -i -c 'type cc'` |
| 期待出力 (定義) | `7:alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'` |
| 期待出力 (重複) | `1` |
| 期待出力 (実効) | `cc is an alias for claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` |
| Pass 判定 | 3 出力すべて期待値と完全一致 |
| Red 状態 (Phase 5 前) | **FAIL**（旧形式 `claude  --verbose --permission-mode bypassPermissions`、`--dangerously-skip-permissions` 未付与） |

## TC-05: bypass モード起動時 permission prompt が出ない

| 項目 | 内容 |
| --- | --- |
| 前提 | `task-claude-code-permissions-deny-bypass-verification-001` 完了済 |
| 実行 | 前提タスクの結論を引用するのみ（独自検証は禁止） |
| 期待 | 前提タスク結論と整合 |
| Pass 判定 | **BLOCKED**（前提タスク未実施・FORCED-GO 制約により判定不能） |
| Red 状態 (Phase 5 前) | **BLOCKED** |

## TC-F-01: `defaultMode` typo 注入（Phase 6 で実注入）

| 項目 | 内容 |
| --- | --- |
| 前提 | Phase 5 Green + backup 取得済 |
| 注入対象 | `/tmp/settings-fail-f01.json`（実機 copy・dry path 推奨） |
| 注入内容 | `permissions.defaultMode` を `bypassPermisson`（typo）に書換 |
| 期待観測 | `jq -r '.permissions.defaultMode'` が typo 値を返す。実機注入時は permission prompt にフォールバック |
| Rollback | dry path: temp 削除のみ。実機注入時: `cp -p ~/.claude/settings.json.bak.<TS> ~/.claude/settings.json` |
| Phase 4 期待値 | 注入手順と rollback 手順の記述のみ（実行は Phase 6） |

## TC-F-02: `cc` alias 重複定義注入（Phase 6 で実注入）

| 項目 | 内容 |
| --- | --- |
| 前提 | Phase 5 Green |
| 注入対象 | `~/.config/zsh/conf.d/79-aliases-tools.zsh` 末尾 |
| 注入内容 | `alias cc='claude'` を追記し `grep -cE '^alias cc='` を 2 にする |
| 期待観測 | `zsh -i -c 'type cc'` 出力が `CC_ALIAS_EXPECTED` 由来文字列と不一致（後勝ち） |
| Rollback | 追加行を削除 → `grep -cE '^alias cc='` が 1 に戻る |
| Phase 4 期待値 | 手順記述のみ |

## TC-R-01: 他 zsh conf に古い alias 残置がない（regression guard）

| 項目 | 内容 |
| --- | --- |
| 実行 | `grep -rcE '^alias cc=' ~/.zshrc ~/.zshenv ~/.zprofile ~/.config/zsh 2>/dev/null \| awk -F: '{s+=$2} END{print s+0}'` |
| 期待出力 | `1`（正本ファイル `79-aliases-tools.zsh` に 1 件のみ） |
| Pass 判定 | 総ヒット数が 1 |
| Phase 4 期待値 | guard スクリプトは Phase 6 で fail-path-tests.md に明記 |
| Red 状態 (Phase 5 前) | **PASS**（現状コメント行 1 + alias 行 1 = 1 / コメントは `^alias cc=` にマッチしない） |

## Red 状態サマリ

| TC | Phase 5 前 | 期待 (Phase 5 後) |
| --- | --- | --- |
| TC-01 | PASS | PASS |
| TC-02 | PASS | PASS |
| TC-03 | **FAIL** | PASS |
| TC-04 | **FAIL** | PASS |
| TC-05 | BLOCKED | BLOCKED |
| TC-F-01 | (Phase 6) | (Phase 6) |
| TC-F-02 | (Phase 6) | (Phase 6) |
| TC-R-01 | PASS | PASS |

→ **TDD Red 達成**: Phase 5 反映で TC-03 / TC-04 を Green 化することが目標。
