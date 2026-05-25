# [#149] [UT-GOV-006] Web deploy target Pages / Workers(OpenNext) 正本整合

## メタ情報

```yaml
issue_number: 149
title: [UT-GOV-006] Web deploy target Pages / Workers(OpenNext) 正本整合
state: OPEN
priority: 中
scale: 小規模
category: -
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/149
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`apps/web` のデプロイ先について、Cloudflare Pages / Workers(OpenNext) の記述が CLAUDE.md / 正本仕様 / GHA / wrangler.toml で混在しているため、現行値（applied）と目標値（target）を分離して同期する。

仕様書: `docs/30-workflows/unassigned-task/UT-GOV-006-web-deploy-target-canonical-sync.md`
親タスク: task-github-governance-branch-protection
発見元: outputs/phase-12/unassigned-task-detection.md (current U-6)

## 受入条件（要旨）

- 4 箇所（CLAUDE.md / canonical doc / GHA / wrangler.toml）の表記を棚卸し
- current applied と target architecture を分けて記録
- 後続 deploy 実装タスクが参照する canonical document を 1 ファイルに固定
- 移行未完了部分は `task-impl-opennext-workers-migration-001` への参照リンクを明記

## 依存

- 関連: `task-impl-opennext-workers-migration-001`（実コード移行は別タスク。本タスクは文書整合のみ）

詳細・苦戦箇所は仕様書参照。
