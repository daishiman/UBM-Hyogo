# Implementation Guide: 06c-A-admin-dashboard

## Part 1: 中学生レベル

管理者ダッシュボードは、学校の職員室にある掲示板のような画面です。会員全体の数、今公開されている会員、まだタグが付いていない会員、フォーム変更で整理が必要な項目を一目で見られるようにします。

ブラウザは台所である D1 を直接のぞきません。給食当番のような API が数字をまとめ、ブラウザはその結果だけを見ます。

管理者がダッシュボードを見たことは、職員室の入室ノートのように `dashboard.view` として記録します。ただし、その記録自身で「最近の作業」や KPI が増え続けないよう、最近の作業一覧からは除外します。

## 専門用語セルフチェック

| 用語 | やさしい説明 |
| --- | --- |
| KPI | いま知りたい大事な数字 |
| API | 画面に必要な情報をまとめて渡す係 |
| D1 | データを保存する場所 |
| audit log | 誰が何をしたかの記録 |
| middleware | 入り口で入ってよい人か確認する仕組み |

## Part 2: Technical

- Treat the current `GET /admin/dashboard` API and `/api/admin/dashboard` web proxy as the existing baseline, not as missing code.
- Update `packages/shared` `AdminDashboardView`, `apps/api/src/repository/dashboard.ts`, `apps/api/src/routes/admin/dashboard.ts`, and `apps/web/app/(admin)/admin/page.tsx` together.
- Return KPI: `totalMembers`, `publicMembers`, `untaggedMembers`, `unresolvedSchema`.
- Return `recentActions` from `audit_log` with `created_at >= now - 7 days`, `LIMIT 20`, excluding `action='dashboard.view'`.
- Append `dashboard.view` after successful admin access.
- Keep apps/web behind the admin API/proxy boundary; no direct D1 access from apps/web.
- Do not add split `/kpi` or `/recent-actions` endpoints unless a later task changes the contract.

## Screenshot Evidence

- Phase 11 screenshot is not captured in this docs-only close-out.
- Runtime execution must save the admin dashboard screenshot to `outputs/phase-11/admin-dashboard-200.png`.
- The screenshot should be taken only after the shared/API/UI contract is updated from the existing `recentSubmissions` dashboard to the 06c-A KPI + `recentActions` contract.
