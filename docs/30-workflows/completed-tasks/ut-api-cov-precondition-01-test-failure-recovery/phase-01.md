# Phase 1: 要件定義 — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 1 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| workflow_state | implemented-local |
| visualEvidence | NON_VISUAL |

## 目的

apps/api coverage が 13 failing tests で early exit し、`apps/api/coverage/coverage-summary.json` が生成されない状態を、後続 coverage hardening の precondition として正確に定義する。

この Phase は仕様作成であり、test green や coverage 閾値達成を PASS 扱いしない。実装・実測 PASS は Phase 11 の実測 evidence が揃った後にのみ判定する。

## Scope In

- 2026-05-01 実測ログの failure inventory 固定: Test Files 10 failed | 75 passed (85), Tests 13 failed | 510 passed (523)
- 13 failure の対象 test file / failing assertion / 期待する recovery outcome の整理
- coverage AC と evidence path の対応付け
- test-fixture implementation / NON_VISUAL / implemented-local 境界の明記
- commit / push / PR 作成の Phase 13 user approval gate 分離

## Scope Out

- アプリケーションコード、test code、fixture の実編集
- `coverageThreshold` 緩和、coverage exclude 追加、skip/todo 化による数値合わせ
- deploy、commit、push、PR 作成
- 後続 UT-08A-01 の coverage 補強実装

## 13 Failure Inventory

| ID | test file | failure focus | recovery expectation |
| --- | --- | --- | --- |
| F01 | `apps/api/src/jobs/sync-forms-responses.test.ts` | AC-4 | form response sync の期待値を現行仕様と照合し、fixture drift か実装 regression かを切り分ける |
| F02 | `apps/api/src/jobs/sync-forms-responses.test.ts` | AC-1 | response ingestion の normal path を green に戻す |
| F03 | `apps/api/src/jobs/sync-forms-responses.test.ts` | AC-5 | member / response identity の混同を修正する |
| F04 | `apps/api/src/jobs/sync-forms-responses.test.ts` | AC-10 | error / edge path を仕様通り green に戻す |
| F05 | `apps/api/src/workflows/schemaAliasAssign.test.ts` | `question_not_found` | not-found handling の status / payload を契約に合わせる |
| F06 | `apps/api/src/workflows/tagQueueResolve.test.ts` | T1 confirmed | tag queue status alias と confirmed/queued 境界を同期する |
| F07 | `apps/api/src/repository/__tests__/adminNotes.test.ts` | `listByMemberId` | repository query と seed data の memberId 境界を修復する |
| F08 | `apps/api/src/routes/admin/attendance.test.ts` | authz 401 | admin authz failure が 401 を返すことを回復する |
| F09 | `apps/api/src/routes/admin/audit.test.ts` | authz 401 | admin audit authz failure が 401 を返すことを回復する |
| F10 | `apps/api/src/routes/admin/schema.test.ts` | GET diff 401 | schema diff endpoint の unauthenticated path を回復する |
| F11 | `apps/api/src/routes/admin/tags-queue.test.ts` | session なし 401 | tags queue endpoint の session missing path を回復する |
| F12 | `apps/api/src/routes/me/index.test.ts` | GET /me 401 | `/me` unauthenticated path を回復する |
| F13 | `apps/api/src/routes/auth/__tests__/auth-routes.test.ts` | hookTimeout 30000ms | auth route test の hang / unresolved hook を解消する |

## Coverage AC

| AC | 判定条件 | Phase 1 での扱い |
| --- | --- | --- |
| AC-1 | 13 failing tests がすべて green | 未実測。PASS 禁止 |
| AC-2 | `bash scripts/coverage-guard.sh` が全パッケージ exit 0 | 未実測。PASS 禁止 |
| AC-3 | `apps/api/coverage/coverage-summary.json` が生成される | 未実測。PASS 禁止 |
| AC-4 | precondition gate として Statements/Branches/Functions/Lines >=80%。85% upgrade gate は UT-08A-01 に委譲 | Phase 11 で実測 |
| AC-5 | 既存 510 passed tests に regression なし | 未実測。PASS 禁止 |
| AC-6 | root cause が `outputs/phase-06/main.md` に整理される | Phase 6 へ引き渡し |

## 実行タスク

1. failure inventory を上表の 13 件で固定する。完了条件: Phase 2 が参照できる ID がある。
2. test-fixture implementation / NON_VISUAL / implemented-local 境界を固定する。完了条件: この Phase では実測 PASS を宣言しない。
3. coverage AC を未実測 gate として定義する。完了条件: AC ごとに evidence path が Phase 7 / Phase 11 へ引き渡される。

## 参照資料

- 起票根拠: 2026-05-01 実測ログ（Test Files 10 failed | 75 passed (85), Tests 13 failed | 510 passed (523)）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`
- `.claude/skills/task-specification-creator/references/coverage-standards.md`
- `.claude/skills/task-specification-creator/references/phase-template-core.md`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

Phase 11 で `cd apps/api && pnpm test`、`cd apps/api && pnpm test:coverage`、`bash scripts/coverage-guard.sh --no-run --package apps/api` を実測し、起票時の 13 failure が回復したことを確認する。Phase 1 では failure inventory と gate 境界だけを固定し、実測 PASS は宣言しない。

## 完了条件

- [ ] 13 failure inventory が Phase 2 以降で参照可能な ID 付きで固定されている。
- [ ] coverage AC は「未実測」であり、Phase 1 の完了条件として PASS 宣言されていない。
- [ ] test-fixture implementation / NON_VISUAL の境界が明記されている。
- [ ] 実装、deploy、commit、push、PR を実行していない。
## 次 Phase への引き渡し

Phase 2 へ、F01-F13 の failure inventory、coverage AC、禁止操作、未実測を PASS 扱いしない判定ルールを渡す。
