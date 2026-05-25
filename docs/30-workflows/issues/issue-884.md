# [#884] [serial-06 followup-003] Phase 6 spec ↔ 実装 Playwright topology の sync

## メタ情報

```yaml
issue_number: 884
title: [serial-06 followup-003] Phase 6 spec ↔ 実装 Playwright topology の sync
state: OPEN
priority: 中
scale: 小規模
category: followup
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/884
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

serial-06 Phase 6 spec は `apps/web/tests/e2e/` + `page.route` mock を前提としていたが、実装は `apps/web/playwright/tests/` + `mockApi` fixture を採用。SSR fetch は `page.route` で intercept 不可。Phase 6 仕様書本体が未更新で drift。

## 仕様書

`docs/30-workflows/unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md`

## 発見元

- serial-06 Phase 12 implementation-guide §「Phase 6 §3 Playwright visual spec の配置」

## 完了条件

- Phase 6 spec 内の path を `apps/web/playwright/tests/...` に統一
- §3 に SSR fetch intercept 制約 note 追記
- `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` に 2 entry 追加
- `verify:phase12-compliance` pass
