# Issue #987 follow-up: `/admin/audit` identity action presets

## メタ情報

```yaml
issue_number: 1039
source_issue: 987
source_workflow: docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/
task_id: task-issue-987-followup-001-audit-log-action-presets
status: unassigned
priority: low
labels:
  - priority:low
  - type:followup
  - type:improvement
  - area:admin-ui
  - area:web
  - scale:small
  - wave:2-plus
governance_mutation_user_gate: false
```

| 項目 | 内容 |
| --- | --- |
| タスク名 | `/admin/audit` action フィルタへの identity 操作プリセット追加 |
| 分類 | follow-up / UI improvement |
| 対象機能 | Admin audit log browser (`AuditLogPanel`) |
| 優先度 | Low |
| 見積もり規模 | Small |
| 発見元 | Issue #987 Phase 10/11 の MINOR 指摘候補 |
| 発見日 | 2026-05-30 |

---

## 1. 概要

Issue #987 では `/admin/identity-conflicts` の dismiss 操作を `audit_log.action='identity.dismiss'` として記録し、既存 `/admin/audit` の action 自由入力フィルタから追跡可能にした。

この follow-up では、既存の自由入力 action フィルタは維持したまま、`identity.merge` / `identity.dismiss` を選びやすくするプリセット UI を追加する。根本機能は既に成立しているため、これは監査ログ閲覧の操作性改善に限定する。

## 2. 背景

Issue #987 の Phase 10/11 では、`AuditLogPanel` への identity action プリセット追加が MINOR 指摘候補として記録された。一方、Phase 12 では「既存 action 自由入力で閲覧可能なため根本解決には不要」と判断し、本体実装からは除外した。

本タスクはその判断を維持しつつ、後続で UI 改善として扱えるように独立仕様化する。

## 3. 目的

- `/admin/audit` 利用者が `identity.merge` / `identity.dismiss` を手入力せず選択できる。
- 既存の action 自由入力フィルタ、URL query、SSR searchParams、cursor pagination を壊さない。
- Issue #987 の NON_VISUAL 実装本体とは分離し、apps/api / D1 / audit_log schema には触れない。

## 4. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | `/admin/audit` の action フィルタ付近に `identity.merge` / `identity.dismiss` を選べる UI がある |
| AC-2 | プリセット選択後も URL query は既存 `action=<value>` 契約を維持し、ページ reload / SSR 初期表示で選択状態が復元される |
| AC-3 | 既存の任意 action 入力（例: `member.delete`, `schema.alias.rollback_notification`）が退化しない |
| AC-4 | cursor pagination の next URL が action filter を保持する |
| AC-5 | `AuditLogPanel` component tests と `/admin/audit` page tests が green |

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260529-180246-wt-8/apps/web/src/components/admin/AuditLogPanel.tsx`
- 症状: Issue #987 本体では API producer 側の `audit_log.action='identity.dismiss'` 記録が根本解決であり、UI は既存自由入力で成立していた。ここにプリセット UI を同一サイクルで混ぜると NON_VISUAL 前提が崩れ、apps/web 視覚差分・Playwright/visual evidence・既存 audit filter tests の更新が必要になる。
- 参照: `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-10/phase-10.md`, `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-11/phase-11.md`, `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| プリセット UI 追加で任意 action の入力自由度が失われる | 中 | Select のみへ置換せず、自由入力を維持する。プリセットは入力補助または datalist/combobox として扱う |
| URL query 契約が変わり既存 `/admin/audit?action=...` deep link が壊れる | 高 | `action` query key は不変。既存 `buildAuditHref` / searchParams 復元 tests を更新して保持を確認する |
| 視覚差分があるのに NON_VISUAL として扱ってしまう | 中 | 本タスクは VISUAL/UI improvement として扱い、必要に応じて component screenshot または Playwright local visual sanity を Phase 11 に追加する |
| identity 専用 UI が他 audit action を目立たなくする | 低 | ラベルは「よく使う action」相当に留め、identity 系だけが唯一の選択肢に見えない配置にする |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/AuditLogPanel.component.spec.tsx app/\\(admin\\)/admin/audit/page.page.spec.tsx
```

期待: action プリセット選択、任意 action 入力、URL query 復元、cursor link query 保持がすべて PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

期待: typecheck / lint が green。apps/api / D1 migration 差分は発生しない。

### 任意 visual sanity

```bash
mise exec -- pnpm --filter @ubm-hyogo/web playwright test --project=chromium apps/web/e2e/admin-audit*.spec.ts
```

期待: `/admin/audit` のフィルタ UI が desktop/mobile で重ならず、既存 audit list の表示を阻害しない。該当 Playwright spec が存在しない場合は component test + local screenshot evidence を Phase 11 で代替する。

## スコープ

### 含む

- `apps/web/src/components/admin/AuditLogPanel.tsx` の action フィルタ入力補助 UI
- `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` の回帰テスト追加
- 必要に応じた `/admin/audit` page test の searchParams 復元テスト追加
- Issue #987 Phase 12 実装ガイドとの参照関係記録

### 含まない

- `apps/api/src/routes/admin/audit.ts` / `apps/api/src/repository/auditLog.ts` の変更
- D1 migration / `audit_log` schema 変更
- `identity.dismiss` audit producer 実装の再変更
- staging / production deploy、commit、push、PR 作成

## 参照

- `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-987-identity-conflicts-audit-log-admin-ui-artifact-inventory.md`
