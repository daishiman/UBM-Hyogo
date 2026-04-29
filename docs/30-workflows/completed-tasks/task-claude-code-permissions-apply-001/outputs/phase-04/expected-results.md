# Phase 4 expected-results: 期待値定数と TC マッピング

## 1. 期待値定数

```
CC_ALIAS_EXPECTED='alias cc='\''claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'\'''
DEFAULT_MODE_EXPECTED="bypassPermissions"
BACKUP_SUFFIX_PATTERN='\.bak\.[0-9]{8}-[0-9]{6}$'
```

### `PROJECT_PERMISSIONS_ALLOW_EXPECTED`（採用候補 b: 既存 + §4 minimum guarantee 包含）

§4 minimum guarantee（必ず包含されること）:

```json
[
  "Bash(pnpm install)",
  "Bash(pnpm typecheck)",
  "Bash(pnpm lint)",
  "Bash(pnpm test)",
  "Bash(git status)",
  "Bash(git diff:*)",
  "Bash(git log:*)"
]
```

既存 139 件は維持。§4 7 件のうち未包含分を append。AC-2 評価基準は **§4 完全包含**であり、既存項目の余剰は許容する。

### `PROJECT_PERMISSIONS_DENY_EXPECTED`（同上）

§4 minimum guarantee（必ず包含されること）:

```json
[
  "Bash(git push --force:*)",
  "Bash(git push -f:*)",
  "Bash(rm -rf /:*)",
  "Bash(curl * | sh:*)"
]
```

既存 13 件は維持。§4 4 件のうち未包含分を append。AC-2 評価基準は **§4 完全包含**。

## 2. 期待 JSON 形（最終形イメージ）

```jsonc
{
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": [
      /* 既存 139 件 */,
      "Bash(pnpm install)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm lint)",
      "Bash(pnpm test)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "deny": [
      /* 既存 13 件 */,
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(curl * | sh:*)"
      /* "Bash(rm -rf /:*)" は既存に包含 */
    ],
    "ask": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Bash(chown:*)"
    ]
  }
}
```

## 3. TC ID と期待値のマッピング表

| TC ID | 期待値定数 | 検証コマンド |
| --- | --- | --- |
| TC-01 | `DEFAULT_MODE_EXPECTED` | `jq -r '.permissions.defaultMode' ~/.claude/settings.json` |
| TC-02 | `N/A`（globalLocal 不在維持） | `test -f ~/.claude/settings.local.json` |
| TC-03 | `PROJECT_PERMISSIONS_ALLOW_EXPECTED` / `PROJECT_PERMISSIONS_DENY_EXPECTED`（§4 包含） | grep ループ |
| TC-04 | `CC_ALIAS_EXPECTED` | `grep -nE '^alias cc=' $ALIAS_FILE` + `zsh -i -c 'type cc'` |
| TC-05 | (BLOCKED) | 前提タスク結論引用 |
| TC-F-01 | `DEFAULT_MODE_EXPECTED` の typo 否定 | `jq -r '.permissions.defaultMode' /tmp/settings-fail-f01.json` |
| TC-F-02 | `CC_ALIAS_EXPECTED` 否定（重複時） | `zsh -i -c 'type cc'` |
| TC-R-01 | 重複検出（総ヒット数 == 1） | `grep -rcE '^alias cc=' ...` |
| backup 命名 | `BACKUP_SUFFIX_PATTERN` | `ls *.bak.* \| grep -E "$BACKUP_SUFFIX_PATTERN"` |

## 4. AC との対応

| AC | TC | 期待値定数 |
| --- | --- | --- |
| AC-1 | TC-01 / TC-02 | `DEFAULT_MODE_EXPECTED` |
| AC-2 | TC-03 | §4 包含（採用候補 b） |
| AC-3 | TC-04 | `CC_ALIAS_EXPECTED` |
| AC-4 | (Phase 5 backup-manifest) | `BACKUP_SUFFIX_PATTERN` |
| AC-5 | TC-05 | BLOCKED |
| AC-6 | (Phase 5 runbook-execution-log) | rollback 手順 3 行 |
| AC-7 | (Phase 11 manual-smoke-log) | NON_VISUAL |

## 5. 検証順序

`outputs/phase-02/validation-path.md` §5 に準拠。
