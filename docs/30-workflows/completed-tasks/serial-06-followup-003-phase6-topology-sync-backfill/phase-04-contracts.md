# Phase 4 — Contracts

## API / 型契約

本タスクはコード変更を伴わないため、追加・変更する API / 型契約は **なし**。

## ドキュメント契約

### T1: Phase 6 spec §3 への追記契約

`phase-06-test-strategy.md` の `## 3. Playwright visual spec` セクション内、`### 3.1 fixture 接続戦略` 表の直下（line 117 と 119 の間）に以下ブロックを挿入:

```markdown
> **重要 — 戦略 A ではなく B を採用する根本理由**:
> Next.js Server Component の `fetch()` は **Node ランタイム側で実行される**ため、Playwright `page.route()` は intercept できない（page.route はブラウザ側初期化リクエストのみ対象）。SSR fetch を mock するには in-process fixture（`mockApi` が `INTERNAL_API_BASE_URL` を差し替える方式）か standalone mock server が必要。詳細は `.claude/skills/task-specification-creator/references/server-component-e2e-pattern.md` を参照。
```

### T2: Phase 10 spec の文言 backfill 契約

`phase-10-local-verification.md` で以下 2 箇所を置換:

| line | before (要旨) | after |
|------|--------------|-------|
| 130 | `... Playwright \`page.route\` mock を使わない場合の補助手段 ...` | `... Playwright in-process mockApi fixture（戦略B）を使わない場合の補助手段 ...` |
| 141 | `... 本 sub-workflow では Playwright \`page.route()\` mock を主とする。` | `... 本 sub-workflow では Playwright in-process mockApi fixture（戦略B）を主とする。SSR fetch intercept のため \`page.route()\` は使わない（Phase 6 §3 参照）。` |

### T3: patterns-lessons-and-pitfalls.md への追記契約

ファイル末尾に以下 2 行 entry を追加:

```markdown
- **pitfall — Server Component fetch + `page.route()` 不整合**: Next.js SSR fetch は Node 側で起きるため Playwright の `page.route()` で intercept できない。in-process mockApi fixture（`INTERNAL_API_BASE_URL` 差し替え）または standalone mock server を使う。詳細 SSOT: [`server-component-e2e-pattern.md`](./server-component-e2e-pattern.md) / [`quality-gates.md` §SSR fetch](./quality-gates.md) / [`phase-11-screenshot-guide.md`](./phase-11-screenshot-guide.md)。
- **pitfall — Playwright `testDir` の topology**: 本リポジトリの Playwright `testDir` は `apps/web/playwright/tests/`（`apps/web/tests/e2e/` ではない）。Phase 6 spec 起草時は `cat apps/web/playwright.config.ts | grep testDir` を最初に実行して現行 path を確認すること。
```

### T4: unassigned-task の frontmatter 契約

frontmatter（メタ情報 YAML ブロック）に以下を追記:

```yaml
status: consumed
canonical_workflow: docs/30-workflows/completed-tasks/serial-06-followup-003-phase6-topology-sync-backfill/
consumed_at: 2026-05-25
consumed_by_issue: 884
```
