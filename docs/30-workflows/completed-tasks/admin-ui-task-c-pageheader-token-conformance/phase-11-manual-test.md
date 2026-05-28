---
spec_classification: implementation_spec
state: spec_created
phase: 11
phase_name: 手動テスト / Evidence
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 11: 手動テスト / Evidence

## 11.1 手動テスト手順

```bash
mise exec -- pnpm --filter web dev
```

別 terminal でログインし、以下 9 route を遷移:

1. `/admin/tags`
2. `/admin/meetings`
3. `/admin/meetings/<id>` (任意の開催ID)
4. `/admin/schema`
5. `/admin/schema/history`
6. `/admin/requests`
7. `/admin/identity-conflicts`
8. `/admin/audit`
9. `/admin/dashboard/attendance`

## 11.2 確認観点

| 観点 | 期待 |
|------|------|
| eyebrow | 設計表 (Phase 2.1) の値で表示される |
| h1 | 設計表 title と一致 |
| breadcrumbs | 末尾要素が現在 page label。クリックで親 route に遷移可能 |
| actions slot | schema page の "resolve 履歴を見る" が右寄せに表示。tags / meetings / requests の操作は既存 panel 内に残る |
| identity-conflicts | 独自 `<main>` 消失。layout main に section が入る。色は token 経由 |
| dashboard / members (regression) | eyebrow が表示されないこと。従来表示維持 |

## 11.3 Evidence 配置

screenshot 9 枚を以下に配置:

```
docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/outputs/phase-11/
├── 01-admin-tags.png
├── 02-admin-meetings.png
├── 03-admin-meetings-detail.png
├── 04-admin-schema.png
├── 05-admin-schema-history.png
├── 06-admin-requests.png
├── 07-admin-identity-conflicts.png
├── 08-admin-audit.png
└── 09-admin-dashboard-attendance.png
```

加えて `manual-test-result.md` に以下を記述:

- 実施日時 / 実施者
- 各 route の確認結果 (pass / fail)
- regression 確認結果 (dashboard / members)
- visual baseline 更新は Task E 委譲である旨

## 11.4 visual baseline (Task E 委譲)

Playwright snapshot の baseline 取得は Task E。本タスクの責務は reference screenshot 9 枚のみ。

## 11.5 Gate-B 通過条件

- screenshot 9 枚が phase-11/ 配下に存在
- `manual-test-result.md` に 9 route 全 pass を記録
- local Playwright authenticated admin fixture で 9 route の h1 が表示される

→ local evidence captured。visual baseline 更新・staging authenticated screenshot は Task E / Phase 13 user-gated。
