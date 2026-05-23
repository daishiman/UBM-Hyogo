# Phase 3: アーキテクチャ・影響範囲

[実装区分: 実装仕様書]

## 1. 変更対象ファイル一覧

| パス | 種別 | 変更内容 |
|------|------|---------|
| `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` | 編集 | `evidenceDir` を env 上書き可能化 + default を `completed-tasks/...` に変更 |
| `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/01-formfield-error.png` 他 11 PNG | 新規 | Playwright 出力 |
| `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md` | 編集 | `runtime_pending` → `completed` および state line 更新 |
| `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-12/unassigned-task-detection.md` | 編集 | Open Runtime Boundary 該当行を consumed に更新（存在する場合） |
| `docs/30-workflows/issue-746-.../outputs/phase-11/screenshots/README.md` | 新規 | 正本 evidence path への pointer |
| `docs/30-workflows/issue-746-.../outputs/phase-12/*.md` | 新規 | Phase 12 strict 7 outputs |

## 2. 関数・型シグネチャ

spec ファイル変更箇所のみ:

```ts
// Before
const evidenceDir = path.resolve(process.cwd(), "../../docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots");

// After
const evidenceDir = path.resolve(
  process.env.PARALLEL09_EVIDENCE_DIR ??
    path.join(
      process.cwd(),
      "../../docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots",
    ),
);
```

入力: `process.env.PARALLEL09_EVIDENCE_DIR` (optional) / `process.cwd()`
出力: 絶対パス文字列
副作用: `mkdir -p` を test 内で実行（既存挙動）

## 3. 依存関係

- 上流: `apps/web/app/visual-harness/[name]/` (harness route) — 変更不要
- 上流: `apps/web/src/components/ui/{FormField,Icon,Breadcrumb,Pagination,EmptyState,FocusVisible}` — 変更不要
- 下流: task-18 / task-22 の visual regression baseline 利用 — 本タスク完了で unblock

## 4. リスクと対策

| リスク | 対策 |
|--------|------|
| dev server 起動が遅延 | curl readiness loop を max 60s で gate、超過時は fail-fast |
| harness route の hydration error | 既知の `'use client'` で対応済（VisualScenarios.client.tsx）。再発時は dev console log を evidence に添付 |
| PNG が 500KB 超過 | viewport 縮小 or `quality` option 検討。AC-1 未達なら spec 微調整は許可 |
| ENOSPC 再発 | phase-10 runbook 適用 |
| issue 再open | コミット文言は `Refs #746` 限定。`Closes #` 等は禁止 |
