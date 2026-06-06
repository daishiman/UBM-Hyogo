# Documentation Changelog — issue-1081-bulk-tag-real-d1-runtime-smoke

## 作成した仕様書ファイル

| 日付 | 変更 | ファイル |
| ---- | ---- | -------- |
| 2026-06-03 | 仕様書 root 新規作成後、実コード実装に合わせて `implemented_local_evidence_captured` へ昇格 | `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/index.md` |
| 2026-06-03 | Phase 1-13 仕様書作成 | `outputs/phase-1..13/phase-N.md` |
| 2026-06-03 | strict 7 outputs 作成 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| 2026-06-03 | `artifacts.json` / `outputs/artifacts.json` 作成・同期（Gate-A passed / Gate-B,C pending） | `artifacts.json`, `outputs/artifacts.json` |
| 2026-06-03 | Phase 11 evidence ledger（NON_VISUAL / local evidence present・runtime evidence pending）作成 | `outputs/phase-11/phase-11.md`, `outputs/phase-11/evidence/runtime-tag-bulk-test.log`, `outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log` |
| 2026-06-03 | runtime smoke runner / SQL fixture / workflow job / shell test 実装 | `scripts/smoke/runtime-tag-bulk.sh`, `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`, `apps/api/migrations/seed/bulk-tag-staging-{seed,cleanup}.sql`, `.github/workflows/runtime-smoke-staging.yml`, `package.json` |
| 2026-06-03 | 2 skill 正本へ同 wave sync | `.claude/skills/task-specification-creator/**`, `.claude/skills/aiworkflow-requirements/**` |

## validator 結果

| validator | コマンド | 期待 |
| --------- | -------- | ---- |
| phase12-compliance | `pnpm verify:phase12-compliance`（CI gate `verify-phase12-compliance`） | canonical 9 見出し逐語一致 + Phase 11 evidence inventory 整合で ok:true |
| gate-metadata | `pnpm gate-metadata:validate` | artifacts.json zod schema 整合・Gate-A passed の evidence_path 実在 |
| indexes | `pnpm indexes:rebuild` | workflow registration を含めて drift 0 |

> local implementation validator は本サイクルで実行済み。staging real D1 mutation smoke は Gate-B user approval 後に実行する。

## current vs baseline

| 観点 | baseline（本タスク前） | current（本タスク後） |
| ---- | ---------------------- | --------------------- |
| bulk tag endpoint の runtime gate | なし（local in-memory D1 テストのみ・staging real D1 未検証） | runtime smoke runner / seed・cleanup SQL / CI job / local test を実装（`implemented_local_evidence_captured`）。staging real D1 実走は user-gated |
| issue #1081 | CLOSED（元 unassigned-task は formalize 済み trace） | CLOSED 維持。phase1-13 実装仕様書として formalizeし、元 unassigned-task の status も消費済みに更新 |
| 既存 runtime smoke のカバレッジ | attendance / `/admin` GET のみ | bulk tag mutation を独立 job として追加済み |

## 変更理由

issue #1081 の真の gap（staging real D1 bulk tag mutation runtime smoke が未取得）を解消するため、issue 本文を**最新コードへ最適化**して実装仕様書化した。最適化点:

- response を issue 本文の `assigned` 単値ではなく実 contract `200 + {batchId, results:[{memberId,tagId,status}]}` で検証。
- パッケージ名を誤記の `@repo/api` から実在の `@ubm-hyogo/api` へ訂正。
- test fixture prefix を親タスク（`e2e_test_issue1036_`）と衝突しない `e2e_test_issue1081_` に固定。
- 再送 noop / unassign の audit count parity（assigned/unassigned のみ append・noop は append なし）を冪等性の根拠として明文化。
