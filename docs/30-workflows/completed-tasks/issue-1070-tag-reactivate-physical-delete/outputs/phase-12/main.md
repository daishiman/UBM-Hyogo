# Phase 12: ドキュメント同期 — メイン

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

本 Phase 12 は Issue #1070「tag master reactivate + physical delete（参照ガード付き）」の close-out。Phase 1-3 で実装契約を凍結し、`apps/api` 実装、focused D1 Vitest、API typecheck、repo lint、正本 API spec 同期、Phase 12 strict 7 + AC-4 runbook、Phase 13 commit-pr-release 草案までを揃えた。

> 本 workflow の `workflow_state` は **`implemented_local_evidence_captured`**。commit / push / PR・staging runtime smoke・**production tag 物理削除**は user-gated のまま残すが、local 実装と検証は本サイクルで完了した。

## strict 7 + runbook 成果物

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `main.md` | 本ファイル（Phase 12 概要 + close-out 状態） |
| 2 | `implementation-guide.md` | Part 1（概念説明）/ Part 2（型・関数・route・audit・SQL・test・DoD） |
| 3 | `system-spec-update-summary.md` | `specs/01-api-schema.md` への reactivate / physical 追記内容 + 参照ガード不変条件 |
| 4 | `documentation-changelog.md` | 作成 doc 一覧（index / artifacts / phase 1-13 / runbook）と要約 |
| 5 | `unassigned-task-detection.md` | 未タスク検出（U-1 強制移行 migration / U-2 admin UI 導線） |
| 6 | `skill-feedback-report.md` | FB-I1070-001..005 |
| 7 | `phase12-task-spec-compliance-check.md` | strict 7 / 4条件 / evidence check（canonical 9 見出し） |
| + | `physical-delete-runbook.md` | AC-4 runbook（physical delete production 運用手順 + AI 実行禁止カテゴリ） |

## close-out 判定

- `workflow_state` = **`implemented_local_evidence_captured`**（local 実装・focused tests・typecheck・lint・正本 spec 同期完了）
- Issue #1070 = **CLOSED 維持**（reopen しない・PR 作成時も `Refs #1070`）
- Gate-A = **passed**（Phase 1-3 設計凍結）／ Gate-B = **passed**（focused D1 Vitest 2 files / 15 tests、typecheck、lint）／ Gate-C = **passed**（close-out・正本 spec 同期完了、runtime/PR は user-gated）
- visualEvidence = **NON_VISUAL**（API only / `apps/web` 非接触。Phase 11 screenshot 不要）
- 不可逆区分 = **`physical deletion 2-stage`**（endpoint コード + 参照ガード + audit + tests は実装可能・production 物理削除 runtime のみ不可逆 user-gated）
- `governance_mutation_user_gate` = **true**

## 凍結した実装契約（SSOT・Phase 3 §3.5）

| 層 | 追加 |
| --- | --- |
| repository | `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` + 型 `PhysicalDeleteTagDefinitionResult` |
| route | `POST /admin/tags/:tagId/reactivate`（audit `admin.tag.reactivated`）/ `DELETE /admin/tags/:tagId/physical`（audit `admin.tag.physically_deleted` / 409 `tag_has_references` + `referenceCount`）。既存論理 `DELETE /admin/tags/:tagId` 不変 |
| test | `tagDefinitions.lifecycle.repository.spec.ts`（D1）/ `tags.lifecycle.contract.spec.ts`。regression: `tags.contract.spec.ts` |
| spec doc | `specs/01-api-schema.md` に reactivate / physical delete + 参照ガード不変条件 + logical/physical code 占有差 |
| migration | 不要（`member_tags` に DB-FK 無し → アプリ層 count ガードを正本化） |

## 実測 evidence

| 検証 | 結果 |
| --- | --- |
| focused D1 Vitest | PASS: `tagDefinitions.write.repository.spec.ts` + `tags.contract.spec.ts`、2 files / 15 tests |
| API typecheck | PASS: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| repo lint | PASS: `mise exec -- pnpm lint` |
| 正本 API spec | `docs/00-getting-started-manual/specs/01-api-schema.md` 同期済み |

## user-gated 境界

staging deploy / runtime smoke / commit / push / PR / **production tag 物理削除** / Issue #1070 状態変更は user-gated。詳細手順は `physical-delete-runbook.md`（production 物理削除）と `outputs/phase-13/phase-13.md`（commit / push / PR）。
