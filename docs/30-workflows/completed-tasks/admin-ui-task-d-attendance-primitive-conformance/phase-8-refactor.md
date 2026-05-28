---
実装区分: 実装仕様書
Phase: 8
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-7-coverage.md](./phase-7-coverage.md)
次: [phase-9-qa.md](./phase-9-qa.md)
---

# Phase 8: リファクタ

## 8.1 barrel export 確認

- inline KpiCard 削除に伴い、`KpiCard` は既存 barrel `apps/web/src/features/admin/components/index.ts` から import する
- `AdminPageHeader` / `AdminTable` / `AdminEmptyState` / `AdminSectionErrorClient` も同 barrel に統一し、深い相対 import のばらつきを増やさない

## 8.2 utility 抽出は行わない

- `fmtPct` は module-local に維持
- by-session / ranking 共通 column 定義の共有化は **行わない**（2 箇所のみで早期抽象化リスクが高い）

## 8.3 dead code 除去

- 旧 inline `function KpiCard` 削除後、未使用 import / 未使用 type が残っていないことを `lint --fix` で確認

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 8 |
| 対象 | refactor |

## 目的

過剰抽象化を避け、import と dead code を整理する。

## 実行タスク

- barrel import へ統一する。
- utility 抽出を行わない判断を維持する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| components barrel | `apps/web/src/features/admin/components/index.ts` | import 正本 |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| Phase 8 spec | `phase-8-refactor.md` | refactor 方針 |

## 完了条件

- [ ] dead code と未使用 import が残っていない。
