# issue-775 serial-05-step-03 schema-diff-resolve runtime evidence 完遂 — canonical workflow root

[実装区分: 実装仕様書]

## 判定根拠

ユーザー指示は「issue は CLOSED のまま」だが、本タスクの目的達成には以下のコード変更が必要なため実装仕様書として作成する（CONST_004 ラベルより実態優先）:

1. 再現性確保のため新規 Playwright spec を追加（`apps/web/playwright/tests/visual/admin-schema-diff.spec.ts`）。本 spec は既存 Playwright admin auth fixture と `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` の schema diff fixture を使い、`SchemaDiffPanel` の 4 pane × 2 viewport + resolve フィードバック 3 状態を capture する
2. D1 seed fixture SQL の新規追加（`scripts/fixtures/serial-05-step-03/seed-diff.sql`）。これは将来の local D1 実結合 capture 用の補助 fixture として保持する。今回の PASS 境界は fixture-backed local visual evidence であり、この Playwright 実行の依存にはしない
3. evidence state 文字列更新（manifest.json / parent workflow の `outputs/phase-11/manifest.json` / `outputs/phase-11/evidence.md` / `outputs/phase-12/main.md` / `outputs/phase-12/unassigned-task-detection.md`）— evidence 生成と一体不可分のドキュメント更新

`SchemaDiffPanel.tsx` / `apps/api/src/routes/admin/schema.ts` / D1 migration / Auth.js 設定の **production code 変更は禁止**（不変条件 §3）。

## 背景（Why this workflow）

- Issue #775 は `unassigned-task/serial-05-step-03-followup-001-runtime-evidence-completion.md` を指して 2026-05-18 06:01:03Z に closed されたが、deliverables 未完了
- 親 workflow (`serial-05-step-03-schema-diff-resolve`) は既に `completed-tasks/` へ移動済みで、本 workflow 実行前の Phase 11 evidence は `partial_local_captured_runtime_pending` 状態だった。本 workflow で 11 PNG を取得し、manifest は `pass: true` / `verdict: PASS` に昇格済み
- 既存 `admin-schema-diff-list.png` は実 PNG ではなく placeholder text だったため `admin-schema-diff-list.placeholder.txt` に退避し、PASS screenshot inventory から除外する。不足 8 枚（4 pane × 2 scale）+ resolve フィードバック 3 枚 = 11 枚を本 workflow で取得済み
- closed issue canonical workflow root recovery パターン（`refs_only`）で本ディレクトリを後付け生成し、Phase 1-13 の物理 gate を満たす
- 後続 serial-05-step-04 / step-05 および regression smoke (task-22) が SchemaDiffPanel baseline に依存するため、本タスク完了が前提条件

## 不変条件

1. Issue は **re-open しない**。コミット文言は `Refs #775` のみ（`Closes #775` 禁止）
2. `SchemaDiffPanel.tsx` / `apps/web/src/lib/admin/api.ts` / `apps/api/src/routes/admin/schema.ts` / D1 schema / Auth.js gate の **production code 変更は禁止**
3. 既存 API endpoint surface (`/admin/schema/diff` / `/admin/schema/alias`) の shape を変えない
4. 新 Playwright spec / seed SQL fixture / `.auth` 除外設定のみ追加可能
5. PNG 配置先は親 workflow の **正本 evidence path** `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/`。本 workflow root の `outputs/phase-11/screenshots/` には README のみ
6. PNG 個別サイズ ≤ 500KB 目安。OKLch トークン整合（HEX 直書き混入禁止 / task-18 grep gate 維持）
7. `127.0.0.1:8787` 等 local 限定 endpoint を `apps/web/src` 配下に焼き込まない（env 経由のみ）
8. `wrangler` 直接実行禁止。`scripts/cf.sh` ラッパー経由（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）
9. `.env` 実値の read / cat / grep 禁止。1Password op 参照のみ
10. コミット・push・PR・GitHub Issue mutation はユーザー指示があるまで実行禁止

## 親仕様 / 参照

- `docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md` — 親 followup spec
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence.md` — Phase 11 evidence 設計
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json` — Issue #775 実行後 `pass: true`、11 valid PNG を列挙、legacy placeholder は非 PNG として分離
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/main.md` — workflow_state / evidence_state 正本
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`
- `apps/web/src/components/admin/SchemaDiffPanel.tsx` (261 LOC, 不変)
- `apps/web/src/lib/admin/api.ts` — `postSchemaAlias()` (不変)
- `apps/web/src/lib/admin/server-fetch.ts` — `fetchAdmin("/admin/schema/diff")` (不変)
- `apps/api/src/routes/admin/schema.ts` (380 LOC, 不変)
- `apps/web/app/(admin)/admin/schema/page.tsx`
- `apps/web/src/lib/env.ts` — `getEnv()` (env access 不変条件)
- `docs/00-getting-started-manual/specs/13-mvp-auth.md` — Magic Link 経路
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`
- 参考: `docs/30-workflows/completed-tasks/issue-746-parallel-09-playwright-visual-evidence-completion/` — 同種パターン

## Phase 構成

| Phase | ファイル | 内容 |
|-------|---------|------|
| 1 | phase-1-requirements.md | 要件・受入条件・期待 PNG 一覧 |
| 2 | phase-2-design.md | Playwright fixture-backed capture / optional D1 seed fixture 設計 |
| 3 | phase-3-architecture.md | 影響範囲・依存・配置ポリシー・evidence path |
| 4 | phase-4-implementation-plan.md | 実装手順（新規 spec / seed SQL / auth fixture） |
| 5 | phase-5-test-plan.md | spec 実行と再現性確認 |
| 6 | phase-6-quality-gates.md | typecheck / lint / grep-gate / PNG サイズ |
| 7 | phase-7-evidence-collection.md | 11 PNG + log の evidence 整理 |
| 8 | phase-8-state-transition.md | runtime_pending → completed 状態遷移 |
| 9 | phase-9-rollback.md | 失敗時の cleanup 手順 |
| 10 | phase-10-operational-runbook.md | local stack トラブル時 runbook |
| 11 | phase-11-visual-evidence.md | screenshot 配置 / manifest 更新 |
| 12 | phase-12-open-runtime-boundary.md | unassigned-task consumed 化と概念説明 |
| 13 | phase-13-pr.md | PR 本文テンプレート（`Refs #775`） |
