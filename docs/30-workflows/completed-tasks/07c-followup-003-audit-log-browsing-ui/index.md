# 07c-followup-003-audit-log-browsing-ui

```yaml
issue_number: 314
issue_url: https://github.com/daishiman/UBM-Hyogo/issues/314
issue_state: CLOSED
task_id: 07c-followup-003-audit-log-browsing-ui
task_name: /admin/audit 監査ログ閲覧 UI
task_type: implementation
visual_evidence: VISUAL
workflow_state: completed
created_at: 2026-05-01
branch: docs/issue-314-audit-log-browsing-ui-task-spec
```

## 目的

07c で append 済みの `audit_log` を、管理者が `/admin/audit` から read-only に検索・閲覧できるようにする実装タスクの仕様書一式を定義する。Issue は closed のまま扱い、既存の `docs/30-workflows/completed-tasks/task-07c-audit-log-browsing-ui.md` を入力単票として、Phase 1-13 の実行可能な仕様へ分解する。

## スコープ

含むもの:

- `GET /admin/audit` API の filter / pagination / admin gate 契約
- `apps/web` の `/admin/audit` 画面、admin sidebar 導線、filter UI、JSON viewer
- `before_json` / `after_json` の表示時 PII マスキング
- JST 入力、UTC query、JST 表示の timezone 境界
- API contract test、repository test、web component test、Playwright visual smoke

含まないもの:

- `audit_log` の編集・削除
- CSV export、SIEM 連携、通知
- Issue の reopen / close 操作、commit、push、PR 作成

## Phase 一覧

| Phase | ファイル | 目的 | 状態 |
| --- | --- | --- | --- |
| 1 | phase-01.md | 要件定義 | completed |
| 2 | phase-02.md | 設計 | completed |
| 3 | phase-03.md | 設計レビュー | completed |
| 4 | phase-04.md | テスト戦略 | completed |
| 5 | phase-05.md | API / repository 実装 | completed |
| 6 | phase-06.md | Web UI 実装 | completed |
| 7 | phase-07.md | AC マトリクス | completed |
| 8 | phase-08.md | リファクタリング / DRY 化 | completed |
| 9 | phase-09.md | 品質保証 | completed |
| 10 | phase-10.md | 最終レビュー | completed |
| 11 | phase-11.md | 手動 smoke / visual evidence | completed |
| 12 | phase-12.md | ドキュメント更新 | completed |
| 13 | phase-13.md | PR 作成準備 | blocked_user_approval |

## 正本参照

| 種別 | パス | 用途 |
| --- | --- | --- |
| Issue 入力 | https://github.com/daishiman/UBM-Hyogo/issues/314 | 要件・AC |
| 旧単票 | docs/30-workflows/completed-tasks/task-07c-audit-log-browsing-ui.md | closed issue の元仕様 |
| API 正本 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | admin API / audit_log 契約 |
| DB 正本 | .claude/skills/aiworkflow-requirements/references/database-implementation-core.md | 07c attendance audit 境界 |
| Admin UI 正本 | .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md | apps/web admin proxy / gate |
| 認証正本 | docs/00-getting-started-manual/specs/02-auth.md | Auth.js + admin gate |
| 無料DB正本 | docs/00-getting-started-manual/specs/08-free-database.md | D1 / UTC / session 方針 |
| Admin 正本 | docs/00-getting-started-manual/specs/11-admin-management.md | admin gate 二段防御 |

## 実装時の不変条件

- `audit_log` は append-only。閲覧 UI に編集・削除アクションを置かない。
- 管理者認可は apps/web layout / proxy と apps/api `requireAdmin` の二段防御を維持する。
- `before_json` / `after_json` は保存値を変更せず、表示時だけマスクする。
- PII マスキングは email / phone / address / name 相当キーを対象にし、展開前にも漏洩しない。
- date range は入力 JST、query UTC、表示 JST として境界テストを置く。
- apps/web から D1 へ直接アクセスしない。
