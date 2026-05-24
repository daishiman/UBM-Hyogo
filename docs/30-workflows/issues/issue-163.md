# [#163] [UT-A2-COV-001] extractTimestampFromLegacy mtime catch 経路の単体テスト追加

## メタ情報

```yaml
issue_number: 163
title: [UT-A2-COV-001] extractTimestampFromLegacy mtime catch 経路の単体テスト追加
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/163
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`scripts/skill-logs-render` の `extractTimestampFromLegacy` 関数で `statSync` failure 時の catch 経路（`return 0`）が単体テスト未到達。Phase 7 coverage report に未到達枝として残るため、`vi.mock("node:fs")` で `statSync` を throw に差し替えるテストを 1 件追加して 100% にする。

## スコープ

- 含む: 単体テスト 1 件追加（`scripts/skill-logs-render.test.ts` 等）
- 含まない: 実装ロジック変更、coverage 閾値変更

## 完了条件

- `mise exec -- pnpm vitest run --coverage` で当該分岐 100%
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` 緑

## 仕様書

- [docs/30-workflows/unassigned-task/ut-a2-cov-001-extract-timestamp-mtime-catch.md](docs/30-workflows/unassigned-task/ut-a2-cov-001-extract-timestamp-mtime-catch.md)

## 参照

- task-skill-ledger-a2-fragment Phase 7 outputs/phase-07/coverage.md
- task-skill-ledger-a2-fragment Phase 12 outputs/phase-12/implementation-guide.md
