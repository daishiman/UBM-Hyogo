# Phase 7 coverage-matrix

## in-scope ファイル / エントリ

| # | パス | Phase 5 操作 |
| --- | --- | --- |
| 1 | `~/.claude/settings.json` | no-op + backup |
| 2 | `<project>/.claude/settings.json` | 更新（allow/deny union） + backup |
| 3 | `~/.config/zsh/conf.d/79-aliases-tools.zsh` | 更新（line 7 alias 正準化） + backup |
| 4 | `~/.zshrc` | no-op + backup |
| 5 | `~/.claude/settings.local.json` | 不在維持（作成しない） |

## マトリクス（3 concern × 8 edge）

| Concern | Edge | TC-01 | TC-02 | TC-03 | TC-04 | TC-05 | TC-F-01 | TC-F-02 | TC-R-01 | カバー判定 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: settings 3 層 | A1: `~/.claude/settings.json` の `permissions.defaultMode` | ✅ | - | - | - | - | ✅ (dry typo) | - | - | Covered |
| A: settings 3 層 | A2: `~/.claude/settings.local.json` の `permissions.defaultMode` | - | ✅ (不在 N/A) | - | - | - | - | - | - | Covered |
| A: settings 3 層 | A3: `<project>/.claude/settings.json` の `permissions.defaultMode` | - | - | ✅ | - | - | - | - | - | Covered |
| B: cc alias | B1: `~/.config/zsh/conf.d/79-aliases-tools.zsh:7` の `alias cc=` | - | - | - | ✅ | - | - | ✅ | - | Covered |
| B: cc alias | B2: 他 zsh conf に古い alias 残置なし | - | - | - | - | - | - | - | ✅ | Covered |
| C: project whitelist | C1: `<project>/.claude/settings.json` `permissions.allow` | - | - | ✅ | - | - | - | - | - | Covered |
| C: project whitelist | C2: `<project>/.claude/settings.json` `permissions.deny` | - | - | ✅ | - | (引用) | - | - | - | Covered（実効性は前提タスク結論引用） |
| C: project whitelist | C3: `<project>/.claude/settings.local.json` 存在確認 | - | - | ✅ (不在 N/A) | - | - | - | - | - | Covered |

## TC マッピングサマリ

- TC-01 → A1
- TC-02 → A2
- TC-03 → A3 / C1 / C2 / C3
- TC-04 → B1
- TC-05 → 引用（C2 実効性のみ）
- TC-F-01 → A1（dry typo）
- TC-F-02 → B1
- TC-R-01 → B2

## 集計

- 全 edge: 8
- Covered: 8
- Uncovered: 0

## out-of-scope（明示除外）

1. bypass 下の `permissions.deny` 実効性（前提タスク `deny-bypass-verification-001` 委譲・FORCED-GO 制約）
2. MCP server / hook の permission 挙動
3. `Edit` / `Write` の whitelist 化（元タスク Phase 10 MINOR 保留）
4. enterprise managed settings

## ループバック先（Uncovered 検出時）

該当なし（全 edge Covered）。
