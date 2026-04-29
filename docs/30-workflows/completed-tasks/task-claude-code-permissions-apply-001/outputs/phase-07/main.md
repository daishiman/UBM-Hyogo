# Phase 7 main: カバレッジ確認サマリ

## in-scope ファイル / エントリ（Phase 5 で書き換えた / backup 取得した範囲）

1. `~/.claude/settings.json`（global / no-op + backup）
2. `<project>/.claude/settings.json`（project / 更新済）
3. `~/.config/zsh/conf.d/79-aliases-tools.zsh`（alias 正本 / 更新済）
4. `~/.zshrc`（conf.d source / no-op + backup）
5. `~/.claude/settings.local.json`（globalLocal / 不在維持・対象外内訳として明示）

## edge 集計

- 全 edge: **8**（Concern A:3 + Concern B:2 + Concern C:3）
- Covered: **8**
- Uncovered: **0**
- out-of-scope（除外）: **4**

## out-of-scope

| 除外項目 | 根拠 |
| --- | --- |
| bypass 下 `permissions.deny` 実効性 | 前提タスク `deny-bypass-verification-001` 委譲（FORCED-GO で BLOCKED） |
| MCP server / hook permission 挙動 | 本タスクスコープ外 |
| `Edit` / `Write` whitelist 化 | 元タスク Phase 10 MINOR 保留 |
| enterprise managed settings | 本タスク対象外 |

## Phase 8 着手判定

**Go**（全 edge Covered、Uncovered 0、out-of-scope 4 件すべて根拠付与済）。
