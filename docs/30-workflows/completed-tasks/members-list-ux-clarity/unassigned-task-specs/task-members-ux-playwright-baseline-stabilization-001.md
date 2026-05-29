# task-members-ux-playwright-baseline-stabilization-001 - タスク仕様書

## メタ情報

```yaml
issue_number: 1005
task_id: task-members-ux-playwright-baseline-stabilization-001
task_name: /members UX clarity Playwright visual baseline 安定化
category: バグ修正
target_feature: apps/web /members visual regression
priority: 中
scale: 小規模
status: 未実施
source_phase: Phase 11 / Phase 12
created_date: 2026-05-28
dependencies:
  - docs/30-workflows/completed-tasks/members-list-ux-clarity/
spec_path: docs/30-workflows/unassigned-task/task-members-ux-playwright-baseline-stabilization-001.md
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-members-ux-playwright-baseline-stabilization-001 |
| タスク名 | /members UX clarity Playwright visual baseline 安定化 |
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`members-list-ux-clarity` では `/members` の density / filter / empty state を 24 PNG で記録したが、Phase 11 runtime notes では Playwright 本体に dev server / mock API warm-up race が残り、欠けた PNG は direct Playwright script で補完している。

### 1.2 問題点・課題

- full Playwright spec が再実行時に安定して green になる保証が弱い。
- direct screenshot 補完と Playwright spec の責務が分離しており、PR前の再現性が低い。
- staging visual baseline 更新前に、local visual evidence の取得手順を1本化できていない。

### 1.3 放置した場合の影響

`/members` UX の回帰検知が「手元の補完PNGありき」になり、CI / reviewer / staging smoke で同じ証跡を再現しづらい。

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/playwright/tests/members-ux-clarity.spec.ts` を、cold start でも安定して 24 state の visual evidence を生成できる状態へ整える。

### 2.2 最終ゴール

- dev server / mock API warm-up を spec 内または test setup で明示的に待機する。
- 24 PNG の生成が direct script 補完なしで完了する。
- Phase 11 runtime notes に残る warm-up race を解消済みに更新できる。

### 2.3 成果物

- `apps/web/playwright/tests/members-ux-clarity.spec.ts` の安定化差分
- 必要に応じた Playwright fixture / setup helper
- `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/evidence/` 配下の再実行ログ

---

## 3. 実行条件

### 3.1 前提条件

- `members-list-ux-clarity` の local implementation が存在すること。
- `pnpm --filter @ubm-hyogo/web typecheck` が通ること。

### 3.2 依存タスク

- 既存: `docs/30-workflows/unassigned-task/task-11-followup-001-member-identities-local-seed.md`
- 関連: GitHub Issue #998 `/members` staging runtime/backfill/browser smoke

---

## 4. 完了条件

- `pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-ux-clarity.spec.ts` が cold start で PASS。
- 24 PNG が Playwright spec 本体から生成される。
- `runtime-notes.md` に direct script 補完不要の証跡が残る。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-120728-wt-8/apps/web/playwright/tests/members-ux-clarity.spec.ts`
- 症状: 初回 dev server / mock API warm-up race により full Playwright spec が完全 green にならず、欠けた PNG を direct Playwright script で補完した。
- 参照: `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/runtime-notes.md`, `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/phase12-task-spec-compliance-check.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| wait 条件を固定 sleep にして flaky 化する | API response / DOM marker / screenshot target の安定条件を待機する |
| seed 不足と warm-up race を混同する | `task-11-followup-001-member-identities-local-seed.md` と責務を分離し、本タスクは local mock / empty state の再現性に限定する |
| screenshot パスが workflow root 外へ drift する | 出力先を `members-list-ux-clarity/outputs/phase-11/` に固定し、Phase 12 compliance に追記する |

## 検証方法

### 単体検証

```bash
pnpm --filter @ubm-hyogo/web typecheck
```

期待: exit code 0。

### 統合検証

```bash
pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-ux-clarity.spec.ts
find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots -name 'members-ux-clarity-*.png' | wc -l
```

期待: Playwright PASS、PNG 数が 24 件以上。

## スコープ

### 含む

- `/members` UX clarity Playwright spec の安定化
- warm-up / mock readiness / screenshot output path の明示
- Phase 11 evidence の再取得

### 含まない

- staging deploy / staging baseline 更新
- production data backfill
- `/members` API の schema / query contract 変更
