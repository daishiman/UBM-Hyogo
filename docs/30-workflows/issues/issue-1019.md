# [#1019] Unified Sidebar Shell Task F: Visual baseline and smoke

# Unified Sidebar Shell Task F: Visual baseline and smoke

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | unified-sidebar-shell-task-f-visual-baseline-smoke |
| タスク名 | 統合 SidebarShell の Playwright smoke / visual baseline 整備 |
| 分類 | implementation |
| 対象機能 | `apps/web/tests/e2e/sidebar-shell-*.spec.ts`, `apps/web/playwright.config.ts` |
| 優先度 | Medium |
| 見積もり規模 | Medium |
| ステータス | unassigned |
| 発見元 | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 発見日 | 2026-05-29 |

## 背景

Task A/E/C/D の実装後、3 role × responsive viewport の regression を防ぐため、Playwright smoke と visual baseline をCIで扱える状態にする必要がある。Task B の local visual evidence は取得済みだが、親 shell 全体の baseline は未取得。

## 目的

viewer/member/admin と 1280/768/375 viewport を対象に、sidebar shell の smoke と screenshot baseline を実装する。

## 受け入れ条件

- smoke spec 6 ケースが PASS
- visual spec 7 screenshot が Linux runner で生成できる
- macOS local 生成 PNG を commit しない運用が明記される
- CI matrix に `sidebar-shell-smoke` と visual job 候補を追加できる
- Task A/E/C/D 完了後の regression gate として再実行できる

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-225049-wt-11/docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-F-visual-baseline-smoke.md`
- 症状: Task B の visual harness は `apps/web/playwright/tests/visual/sidebar-user-menu.spec.ts` と local screenshots に限定されており、親 shell の route-level baseline とは保存先・runner・snapshot policy が異なる。
- 参照: `docs/30-workflows/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-12/phase12-task-spec-compliance-check.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| macOS local screenshot と Linux CI baseline の差分が混入する | baseline commit は Linux runner artifact 由来に限定し、local PNG は evidence 扱いに分離する |
| auth fixture drift で member/admin smoke が flaky になる | 既存 `apps/web/tests/e2e/fixtures/auth.ts` を再利用し、新規 storage state を増やさない |
| screenshot path template が既存 visual tasks と衝突する | `projectName` を含む `snapshotPathTemplate` を確認し、Task F 専用 project 名を使う |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test sidebar-shell-smoke
```

期待: 6 smoke cases が 0 fail / 0 flaky。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test sidebar-shell-visual --update-snapshots
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: visual spec がローカルで実行可能。baseline commit は Linux runner artifact 確認後に別途 user-gated。

## スコープ

### 含む

- smoke spec
- visual spec
- sidebar helper
- Playwright project / CI gate candidate
- Phase 11 evidence path 更新

### 含まない

- Task A/E/C/D の機能実装
- staging deploy / production runtime visual
- commit / push / PR

## 参照

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-F-visual-baseline-smoke.md`
- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md`


