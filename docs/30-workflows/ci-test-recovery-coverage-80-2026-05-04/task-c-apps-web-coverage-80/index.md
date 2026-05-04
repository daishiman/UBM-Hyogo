# task-c-apps-web-coverage-80

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | ci-recover-task-c-web-coverage-80 |
| parent wave | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/` |
| wave | wave-2（Task A 完了後に着手） |
| mode | parallel（5 lane 並列） |
| owner | - |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| status | spec_created |
| implementation_mode | new |
| dependencies | Task A (`ci-recover-task-a-vitest-jsx-dev-runtime`) |
| blocks | Task E (`coverage-gate hard gate 化`) |
| 作成日 | 2026-05-04 |

## 目的

`apps/web` の coverage を baseline (Lines 39.39 / Branches 68.01 / Functions 43.51 / Statements 39.39) から **全 metric ≥80%** に引き上げる。

主たる手段は新規 test 追加（components/admin・components/public・components/ui の不足ケース、lib/admin・lib/api/me-requests*・lib/url・lib/fetch の未カバー分岐）。
testability 改善が必要な場合のみ実装側を最小修正する（複雑な refactor は本タスクのスコープ外）。

## why this task is needed

- 親 wave Phase 1 の AC-4 (`apps/web coverage 全 metric ≥80%`) を満たす唯一の経路。
- baseline の <80% ファイルは合計 34 件（0% カバレッジ 20 件 / 部分カバレッジ 14 件）。
- 既存 `ut-web-cov-{01,02,03,04}` は完了済みだが、main 取り込み後の再計測で残未達分が顕在化している。
- coverage-gate hard gate 化（Task E）の前提条件であり、未達のまま hard gate 化すると main CI が即赤化する。

## scope

### Scope In

- `apps/web/src/components/admin/**/*.tsx` 既存テストの不足ケース追加 / 未テストファイルの新規テスト
- `apps/web/src/components/public/**/*.tsx` 同上
- `apps/web/src/components/ui/**/*.{ts,tsx}` 既存テストの不足ケース追加（特に Avatar / Button / Chip / Input / Select / Textarea / KVList / LinkPills / icons / index）
- `apps/web/src/components/{auth,feedback,layout}/**/*.tsx` 不足分
- `apps/web/src/lib/admin/{api,server-fetch,types}.ts` 補強
- `apps/web/src/lib/api/me-requests*.ts` / `me-types.ts` 補強
- `apps/web/src/lib/url/*.ts` 補強（特に `safe-redirect.ts` / `login-redirect.ts` の分岐）
- `apps/web/src/lib/fetch/{authed,public}.ts` 不足分
- `apps/web/src/lib/{auth,session,tones}.ts` 不足分
- `apps/web/src/test-utils/` 共通 fixtures 拡充（DRY 化）

### Scope Out

- jsx-dev-runtime 解決（Task A 責務）
- apps/api 関連（Task B/D 責務）
- coverage-gate hard gate 化（Task E 責務）
- Cloudflare deploy / Workers binding 系の e2e
- Playwright e2e の新規追加
- 大規模リファクタ（純粋関数化以上の構造変更）

## dependencies

### Depends On

- Task A: `apps/web` の vitest 起動が成立していること（`react/jsx-dev-runtime` 解決済み）

### Blocks

- Task E: coverage-gate hard gate 化

## refs

- 起票根拠: `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/outputs/phase-1/phase-1-requirements.md` AC-4
- baseline 実測: 2026-05-04 main 計測 `apps/web/coverage/coverage-summary.json`（Lines 39.39 / Branches 68.01 / Functions 43.51 / Statements 39.39）
- 既存 wave: `docs/30-workflows/ut-coverage-2026-05-wave/README.md`
- 完了済み参考: `docs/30-workflows/completed-tasks/ut-web-cov-{01,02,03,04}-*/`
- coverage 標準: `.claude/skills/task-specification-creator/references/coverage-standards.md`
- testing pattern: `.claude/skills/task-specification-creator/references/patterns-testing.md` / `patterns-testing-and-implementation.md`
- root vitest: `vitest.config.ts`
- web test script: `apps/web/package.json` `scripts.test:coverage`

## Acceptance Criteria

| ID | 内容 | 検証方法 |
| --- | --- | --- |
| AC-1 | `apps/web/coverage/coverage-summary.json` の `total.statements.pct` ≥80 | `jq '.total.statements.pct' apps/web/coverage/coverage-summary.json` |
| AC-2 | 同 `total.branches.pct` ≥80 | 同上 |
| AC-3 | 同 `total.functions.pct` ≥80 | 同上 |
| AC-4 | 同 `total.lines.pct` ≥80 | 同上 |
| AC-5 | `bash scripts/coverage-guard.sh --package apps/web` exit 0 | shell exit code |
| AC-6 | 既存テスト regression 0（全 test pass） | `pnpm --filter @ubm-hyogo/web test` exit 0 |
| AC-7 | Phase 11 evidence: `coverage-before.json` / `coverage-after.json` / `coverage-diff.md` / `manual-evidence.md` の 4 点が揃う | ファイル存在 + JSON parse |
| AC-8 | 80% 到達不能ファイルがある場合は `vitest.config.ts` の `coverage.exclude` 追加 + `outputs/phase-12/unassigned-task-detection.md` に除外理由明記（CONST_007 後送り回避） | docs grep |

## 13 phases

- [phase-1.md](outputs/phase-1/phase-1.md) — 要件定義（baseline 取得 + lane 分割確定）
- [phase-2.md](outputs/phase-2/phase-2.md) — 設計（lane 別テスト設計戦略）
- [phase-3.md](outputs/phase-3/phase-3.md) — 設計レビュー
- [phase-4.md](outputs/phase-4/phase-4.md) — テスト戦略（test case 一覧化）
- [phase-5.md](outputs/phase-5/phase-5.md) — 実装ランブック（lane 別テスト追加）
- [phase-6.md](outputs/phase-6/phase-6.md) — 異常系・エッジケース補強
- [phase-7.md](outputs/phase-7/phase-7.md) — カバレッジ確認
- [phase-8.md](outputs/phase-8/phase-8.md) — DRY 化（fixtures 集約）
- [phase-9.md](outputs/phase-9/phase-9.md) — 品質保証
- [phase-10.md](outputs/phase-10/phase-10.md) — 最終レビュー
- [phase-11.md](outputs/phase-11/phase-11.md) — coverage 実測 evidence（NON_VISUAL）
- [phase-12.md](outputs/phase-12/phase-12.md) — ドキュメント更新（必須 7 成果物）
- [phase-13.md](outputs/phase-13/phase-13.md) — PR 作成（user 承認後）

## outputs

- outputs/phase-1/main.md, web-coverage-baseline.log, file-undercoverage-list.md
- outputs/phase-2/main.md, lane-design.md
- outputs/phase-3/main.md, design-review.md
- outputs/phase-4/main.md, test-case-catalog.md
- outputs/phase-5/main.md, implementation-runbook.md
- outputs/phase-6/main.md, edge-case-catalog.md
- outputs/phase-7/main.md, coverage-progress.md
- outputs/phase-8/main.md, refactor-log.md
- outputs/phase-9/main.md, qa-result.md
- outputs/phase-10/main.md, final-review-result.md
- outputs/phase-11/main.md, coverage-before.json, coverage-after.json, coverage-diff.md, manual-evidence.md
- outputs/phase-12/main.md, implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md, phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md（blocked placeholder）

## invariants touched

- CLAUDE.md #5: D1 直アクセスは `apps/api` に閉じる（test 内でも `apps/web` から直接 D1 を触らない）
- CLAUDE.md #6: GAS prototype を本番仕様に昇格させない（mock fixture が GAS prototype 由来でも本番契約として扱わない）

## completion definition

全 13 phase 仕様書が揃い、`apps/web` の coverage 全 metric ≥80% 達成 evidence と既存テスト regression 0 が Phase 11/12 に同期されていること。`bash scripts/coverage-guard.sh --package apps/web` exit 0。deploy / commit / push / PR 作成はユーザー承認まで実行しない（Phase 13 blocked）。
