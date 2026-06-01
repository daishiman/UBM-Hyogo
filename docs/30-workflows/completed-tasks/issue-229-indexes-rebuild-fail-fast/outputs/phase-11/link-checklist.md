# link-checklist — Phase 11 関連リンク整合確認

> 本ワークフローは仕様書整備と実コード hardening。本 checklist は `index.md` / `artifacts.json` / 各 phase / 参照リンクの相互健全性を確認する。実装サイクルでも同 checklist を再実行する。

## 1. 確認方針

- 各リンクは worktree のファイルが実在することを確認する。
- 実ファイルと仕様書記述に矛盾がある場合は `discovered-issues.md` に転記する。
- `generate-index.js` 等の実コードは本ワークフローでは読み取り対象外（仕様書整備のため）。リンク健全性は docs 内に閉じて確認する。

## 2. ワークフロー内リンク

| # | パス | 状態 |
| --- | --- | --- |
| 1 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/index.md | [x] 存在 / メタ情報・AC・Phase 一覧が `artifacts.json` と一致 |
| 2 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/artifacts.json | [x] 存在 / phases[].outputs と実ファイルが一致 |
| 3 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-01.md | [x] 存在 / outputs/phase-01/main.md にリンク |
| 4 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-02.md | [x] 存在 / 関数シグネチャ・TC-01〜07 を含む |
| 5 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-03.md | [x] 存在 / 代替案 4 案 + PASS/MINOR/MAJOR を含む |
| 6 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-04.md 〜 phase-13.md | [x] 存在 / 各 outputs path が `artifacts.json` と一致 |
| 7 | outputs/phase-01/main.md | [x] 存在 |
| 8 | outputs/phase-02/main.md | [x] 存在 |
| 9 | outputs/phase-03/main.md | [x] 存在 |
| 10 | outputs/phase-08/main.md | [x] 存在（DRY 化記録） |
| 11 | outputs/phase-09/main.md | [x] 存在（品質保証） |
| 12 | outputs/phase-10/main.md | [x] 存在（最終レビュー） |
| 13 | outputs/phase-11/{main,manual-smoke-log,manual-test-checklist,manual-test-result,link-checklist,discovered-issues}.md | [x] 全 6 件存在 |
| 14 | outputs/phase-11/screenshot-plan.json | [x] 存在（NON_VISUAL スクリーンショット不要判定） |

## 3. hardening 対象 / 回帰維持対象（参照のみ・本 PR では未編集）

| # | パス | 状態 |
| --- | --- | --- |
| 15 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | [x] 参照 / hardening 対象（実装サイクルで編集） |
| 16 | scripts/__tests__/generate-index-fail-fast.spec.ts | [ ] 新規（実装サイクルで作成予定） |
| 17 | scripts/hooks/indexes-drift-guard.sh | [x] 参照 / pre-push 回帰維持対象（本 PR 未編集） |
| 18 | .github/workflows/verify-indexes.yml | [x] 参照 / CI 回帰維持対象（本 PR 未編集） |
| 19 | scripts/verify-pr-ready.sh | [x] 参照 / drift gate（本 PR 未編集） |
| 20 | scripts/cf-audit-log/feature-export.ts | [x] 参照 / atomic write 先例 |
| 21 | vitest.config.ts | [x] 参照 / test glob 正本 |

## 4. 起点 / 原典スペック

| # | パス | 状態 |
| --- | --- | --- |
| 22 | docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/index.md | [x] 存在 / 起点 T-6 ワークフロー |
| 23 | docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/task-skill-ledger-t6-indexes-rebuild-fail-fast.md | [x] 存在 / 起点 spec（AC-1〜AC-4 原文） |
| 24 | docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md | [x] 存在 / U-5 検出根拠 |

## 5. プロジェクト共通

| # | パス | 状態 |
| --- | --- | --- |
| 25 | CLAUDE.md | [x] hook 方針（post-merge 廃止 / `pnpm indexes:rebuild` / CI gate）/ 不変条件 #8 と整合 |
| 26 | .claude/skills/aiworkflow-requirements/references/technology-devops-core.md | [x] 参照 / hook 運用正本 |

## 6. GitHub 連携

| # | 項目 | 状態 |
| --- | --- | --- |
| 27 | Issue #229 | [x] CLOSED のまま参照のみ（再 open していない） |

## 7. 完了判定

すべてのチェックボックスが ✓（#16 は実装サイクルで新規作成のため未作成が正常）になり、矛盾が `discovered-issues.md` に記録されていない場合のみ Phase 12 へ進む。
