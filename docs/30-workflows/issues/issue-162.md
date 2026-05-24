# [#162] [UT-A2-SMOKE-001] skill ledger A-2 fragment 4 worktree 並列追記 smoke 実機検証

## メタ情報

```yaml
issue_number: 162
title: [UT-A2-SMOKE-001] skill ledger A-2 fragment 4 worktree 並列追記 smoke 実機検証
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/162
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

skill ledger A-2 fragment 化の主目的「4 worktree 並列追記の同一バイト位置 conflict 0 件」を実 worktree merge smoke で検証する。Phase 6 単体テストと Phase 11 証跡フォーマット固定までは完了したが、実環境での再現は未実施。

## スコープ

- 含む: smoke worktree 4 本作成 → fragment 生成 → main へ順次 merge → conflict 0 件確認、`pnpm skill:logs:render --skill aiworkflow-requirements` の出力検証、証跡保存
- 含まない: CI guard 追加（UT-A2-CI-001）、A-1/A-3/B-1 実装

## 完了条件

- `git ls-files --unmerged` 0 行
- `pnpm skill:logs:render --skill aiworkflow-requirements` で 4 entry が timestamp 降順表示
- `outputs/phase-11/4worktree-smoke-evidence.md` に証跡保存

## 仕様書

- [docs/30-workflows/unassigned-task/ut-a2-smoke-001-4worktree-smoke-evidence.md](docs/30-workflows/unassigned-task/ut-a2-smoke-001-4worktree-smoke-evidence.md)

## 参照

- task-skill-ledger-a2-fragment Phase 11 / Phase 12 outputs/phase-12/implementation-guide.md
- task-skill-ledger-a2-fragment Phase 12 outputs/phase-12/unassigned-task-detection.md
