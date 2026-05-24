# [#167] [task-claude-code-mcp-hook-permission-verification-001] MCP server / hook permission の挙動検証

## メタ情報

```yaml
issue_number: 167
title: [task-claude-code-mcp-hook-permission-verification-001] MCP server / hook permission の挙動検証
state: OPEN
priority: 低
scale: -
category: -
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/167
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | 未実施 |

---

## 概要

`bypassPermissions` / `--dangerously-skip-permissions` 下での MCP server permission および hook permission の評価順序・allow/deny/ask 挙動を検証する。

## 仕様書

`docs/30-workflows/unassigned-task/task-claude-code-mcp-hook-permission-verification-001.md`

## 発見元

`task-claude-code-permissions-apply-001` Phase 12 unassigned-task-detection（N3）
