# issue-777-schema-diff-resolve-history-view

> Source issue: [#777](https://github.com/daishiman/UBM-Hyogo/issues/777)（OPEN のまま仕様書化）
> Parent unassigned spec: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md`
> Parent workflow: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/`
> 実装区分: **実装仕様書**（CONST_005 必須項目すべてを含む / CONST_007 1サイクル完了スコープ）
> taskType: implementation
> visualEvidence: VISUAL（admin UI 追加のため Phase 11 にて screenshot 要）
> workflow_state: CONTRACT_READY_IMPLEMENTATION_PENDING

## 概要

`SchemaDiffPanel`（`apps/web/src/components/admin/SchemaDiffPanel.tsx`）は現状「現在の未解決 diff」のみを描画し、resolve 完了後の操作履歴は UI から到達できない。
本タスクは `/(admin)/admin/schema/history` を独立 route として新設し、`apps/api/src/routes/admin/audit.ts` の既存 cursor pagination endpoint を `action=schema_diff.alias_assigned` で filter する経路を再利用することで、「誰がいつどの question を どの stableKey に resolve したか」を admin が時系列降順で閲覧・filter できるようにする。

shared primitive（Pagination / FormField / Breadcrumb / EmptyState）を再利用し、新規 primitive・新規 API endpoint・新規 D1 column を追加しない。色は OKLch token のみ使用する。

## 決定事項（着手時に確定済み）

| 判断点 | 採用 | 根拠 |
|---|---|---|
| §2.5 endpoint | **案 A: 既存 `/admin/audit?action=schema_diff.alias_assigned` 再利用** | `apps/api/src/routes/admin/audit.ts` が `actorId/actorEmail/action/targetType/targetId/maskedBefore/maskedAfter/createdAt` を含む list response を既に zod 検証済みで返し、cursor pagination も実装済み。schema 領域専用 endpoint を増やさず既存 surface を維持できる。payload 不足が Phase 5 で判明した場合のみ案 B へ昇格（fallback path も artifacts.json に記録）。 |
| §2.6 route | **案 α: `/(admin)/admin/schema/history` 独立 route** | filter + 50 件 pagination を担い視覚負荷が高いため、現 diff page (`/(admin)/admin/schema`) と分離し Breadcrumb で導線を貼る。 |

## 親 workflow / 関連

- 親 step: serial-05 step-03（`SchemaDiffPanel` resolve mutation 実装済み）
- 親 Phase 12 後続候補: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` §3「diff history view」を consumed 化（Phase 12 で更新）
- followup-002 (bulk resolve) / followup-004 (rollback) とは独立。本タスクは followup-004 の前提 UI 基盤を提供する。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | phase-4-test-plan.md | テスト計画（Phase 1-3 後に着手） |
| 5 | phase-5-implementation.md | 実装手順 |
| 6 | phase-6-test-additions.md | テスト追加 |
| 7 | phase-7-coverage.md | カバレッジ |
| 8 | phase-8-refactor.md | リファクタ |
| 9 | phase-9-qa.md | QA |
| 10 | phase-10-final-review.md | 最終レビュー |
| 11 | phase-11-manual-test.md | 手動テスト（VISUAL: admin authenticated screenshot） |
| 12 | phase-12-documentation.md | ドキュメント（Phase 12 strict 7 outputs + 中学生レベル概念説明） |
| 13 | phase-13-pr.md | PR 作成 |

## 変更対象ファイル

| パス | 区分 | 内容 |
|---|---|---|
| `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | 新規 | 履歴一覧 client component（filter + Pagination + EmptyState） |
| `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` | 新規 | component spec（filter / pagination / 空状態 / fetch エラー連携の 4 観点） |
| `apps/web/app/(admin)/admin/schema/history/page.tsx` | 新規 | thin server wrapper。search params を `SchemaDiffHistoryPanel` に渡す |
| `apps/web/app/(admin)/admin/schema/page.tsx` | 修正 | Breadcrumb / 履歴 page への link 追加（最小差分） |
| `apps/web/src/lib/admin/api.ts` | 修正 | `fetchSchemaAliasHistory()` helper 追加（read-only fetch wrapper） |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | 修正 | `fetchSchemaAliasHistory()` の unit spec 追加 |
| `apps/api/src/workflows/schemaAliasAssign.ts` | 修正済み | 既存 audit payload の `after` に `questionText` を追加（AC-2 の前提 hardening） |
| `apps/api/src/workflows/schemaAliasAssign.contract.spec.ts` | 修正済み | `schema_diff.alias_assigned` audit payload に `questionText` が入ることを focused assertion で固定 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | 修正 | 履歴閲覧 UI 仕様の追記（Phase 12） |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` | 修正 | §3「diff history view」を consumed 化（Phase 12） |

（案 B 昇格時のみ追加対象: `apps/api/src/routes/admin/schema.ts` + `docs/00-getting-started-manual/specs/01-api-schema.md`。本仕様では原則対象外。）

## スコープ外（CONST_007 例外なし・先送りなし）

以下は **本タスクのスコープ外**だが、いずれも既存 follow-up タスクで分離済みのため「先送り」ではない:

- rollback / undo UI（履歴行 → 取消操作） → **followup-004 で別タスク**として既に分離済み
- bulk resolve UI（複数 alias を 1 操作で resolve） → **followup-002 で別タスク**として既に分離済み
- 履歴 CSV / TSV export → さらに後続（本仕様では検出のみ、別タスク化は本 PR で扱わない）
- D1 schema 変更 / 新 column 追加 → **禁止**（既存 audit log table を再利用）
- 新 API endpoint 追加 → 原則禁止（§2.5 案 A 採用。案 B 昇格は Phase 5 で payload 不足判明時のみ・本仕様での既定値は案 A）

本タスクの in-scope はすべて 1 サイクル内（Phase 1-13）で完了させる。現 wave では UI 実装前提の API audit payload hardening のみ実コードへ反映済み。`workflow_state` は仕様書作成段階で `CONTRACT_READY_IMPLEMENTATION_PENDING`、UI 実装完了時に `implemented_local` → CI/PR 完了時に `completed` へ遷移する。
