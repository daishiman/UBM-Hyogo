# ut-api-cov-precondition-01-test-failure-recovery

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | ut-coverage |
| mode | serial |
| owner | - |
| 状態 | implemented-local / test-fixture implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| precondition coverage gate | PASS（apps/api test green + coverage-summary.json 生成 + guard exit 0 + 80% gate） |
| upgrade coverage gate | UT-08A-01 に委譲（Statements/Functions/Lines >=85%, Branches >=80%） |
| approval gate | commit / push / PR 作成は Phase 13 で user approval 必須 |

## purpose

apps/api の test:coverage が 13 件失敗で early exit し coverage-summary.json が生成されない問題を修復するための実装仕様を固定する。これは UT-08A-01 を含む apps/api 系 coverage 計測タスクすべての pre-condition である。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、2026-05-01 実測の coverage<80% と apps/api coverage early exit を解消するための新規 follow-up gate である。実測値は `packages/*/coverage/coverage-summary.json`、`apps/web/coverage/coverage-summary.json`、および apps/api の 13 件 failure log を起票根拠とする。

## scope in / out

### Scope In
- apps/api/src/jobs/sync-forms-responses.test.ts（4件: AC-4/AC-1/AC-5/AC-10）
- apps/api/src/workflows/schemaAliasAssign.test.ts（question_not_found）
- apps/api/src/workflows/tagQueueResolve.test.ts（T1 confirmed）
- apps/api/src/repository/__tests__/adminNotes.test.ts（listByMemberId）
- apps/api/src/routes/admin/attendance.test.ts（authz 401）
- apps/api/src/routes/admin/audit.test.ts（authz 401）
- apps/api/src/routes/admin/schema.test.ts（GET diff 401）
- apps/api/src/routes/admin/tags-queue.test.ts（session なし 401）
- apps/api/src/routes/me/index.test.ts（GET /me 401）
- apps/api/src/routes/auth/__tests__/auth-routes.test.ts（hookTimeout 30000ms）
- 各 failure の root cause 調査と最小修復
- coverage-guard.sh 再実行で apps/api/coverage/coverage-summary.json 生成成功まで

### Scope Out
- apps/api コード本体への機能追加
- coverage 補強そのもの（後続 UT-08A-01 に委譲）
- 関連しない test の refactoring
- coverage exclude / threshold 緩和による数値合わせ

## dependencies

### Depends On
- なし（base は existing apps/api test 基盤）

### Blocks
- ut-08a-01-public-use-case-coverage-hardening（apps/api coverage 計測の前提）

## refs

- 起票根拠: 2026-05-01 実測ログ（Test Files 10 failed | 75 passed (85), Tests 13 failed | 510 passed (523)）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/03-data-fetching.md
- .claude/skills/task-specification-creator/references/coverage-standards.md
- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/phase-12-spec.md
- .claude/skills/aiworkflow-requirements/indexes/resource-map.md

## AC

- 全 13 test が green
- `cd apps/api && pnpm test` が exit 0、`apps/api/coverage/coverage-summary.json` が生成される
- `bash scripts/coverage-guard.sh --no-run --package apps/api` が exit 0
- precondition gate として apps/api coverage Statements/Branches/Functions/Lines >=80%
- upgrade gate（Statements/Functions/Lines >=85%, Branches >=80%）は既存 `ut-08a-01-public-use-case-coverage-hardening` に委譲済みであり、本タスクでは PASS 条件に含めない
- 既存 510 件 PASS test に regression なし
- failure root cause が outputs/phase-06/main.md に整理される
- Phase 11 evidence は実測後の `outputs/phase-11/coverage-result.md`、`regression-check.md`、`manual-evidence.md` で閉じる
- Phase 12 は strict 7 files と root / outputs `artifacts.json` parity を満たす

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## invariants touched

- #1 responseEmail system field
- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- auth/session route は docs/00-getting-started-manual/specs/02-auth.md と矛盾させない
- data fetching / D1 mock は docs/00-getting-started-manual/specs/03-data-fetching.md と矛盾させない

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。実装後に aiworkflow-requirements の workflow inventory / quick-reference / resource-map へ同期するか、同期不要理由を `outputs/phase-12/system-spec-update-summary.md` に明記する。
