# Phase 13 — PR 前ローカル検証結果

> ステータス: `implemented_local_evidence_captured`。commit / push / PR は user 承認後のみ。staging screenshot は user-gated。

---

## 1. 想定検証コマンド（CLAUDE.md「PR作成の完全自律フロー」§5）

| # | コマンド | 目的 | 本サイクル結果 |
| --- | --- | --- | --- |
| 1 | `mise exec -- pnpm install --force` | 依存整合 | 未実行（lockfile / dependency 変更なしのため不要） |
| 2 | `mise exec -- pnpm typecheck` | 型チェック | PASS（7 workspace projects） |
| 3 | `mise exec -- pnpm lint` | リント | PASS（dependency-cruiser / stablekey / no-inline-style / workspace lint） |
| 4 | `pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/admin-audit-log-japanese-clarity-and-filter-collapse` + `node --import tsx scripts/gate-metadata/validate.ts` | phase12-compliance / gate-metadata | PASS（phase12 status pass、gate-metadata ERROR 0 / WARN 339 既存 skipped） |

## 2. VISUAL タスク固有の追加検証（実装サイクル）

| # | コマンド | 目的 | 本サイクル結果 |
| --- | --- | --- | --- |
| 5 | `mise exec -- pnpm verify:tokens` | HEX / token gate（AC-8） | PASS（design tokens in sync / 91 tracked） |
| 6 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/admin/__tests__/auditGlossary.spec.ts apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | focused vitest（AC-1〜AC-6） | PASS（4 files / 57 tests） |
| 7 | `git diff --name-only -- apps/api packages/shared` | API/shared diff 空確認（AC-9） | PASS（空） |

## 3. 失敗時の自動修復方針（CLAUDE.md 準拠）

| 失敗 | 修復方針 |
| --- | --- |
| install 失敗 | lockfile 不整合を疑い最小再生成 |
| typecheck 失敗 | unused import / null 許容 / 型注釈漏れ / export-import 不整合を最小差分で修正 |
| lint 失敗 | `pnpm lint --fix` → 残違反を手修正 |
| verify-pr-ready 失敗 | `pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い gate-metadata → phase12-compliance → indexes drift の順で切り分け |

> 最大 3 回まで自動修復し、修復差分をコミットする（ただし commit 自体は user 承認後）。

## 4. 現在の記録

| 項目 | 値 |
| --- | --- |
| 実行状態 | `implemented_local_evidence_captured`。focused vitest / typecheck / lint / verify:tokens / phase12-compliance / gate-metadata PASS |
| 未実行 | dependency install（不要判定）/ visual capture 6 PNG |
| 承認境界 | commit / push / PR / staging capture は user 承認後のみ |
