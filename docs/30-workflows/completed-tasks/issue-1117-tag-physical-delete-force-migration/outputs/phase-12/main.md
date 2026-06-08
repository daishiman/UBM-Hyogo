# Phase 12: ドキュメント同期 — メイン

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

本 Phase 12 は Issue #1117「tag physical delete force-migration（参照付き tag の強制移行）」（= issue-1070 followup-001）の close-out。Phase 1-3 で実装契約を凍結し、`apps/api` 実装、focused D1 Vitest、正本 API spec 同期、Phase 12 strict 7 + AC-6 runbook、Phase 13 commit-pr-release 草案までを同一サイクルで揃えた。

> 本 workflow の `workflow_state` は **`implemented_local_evidence_captured`**。コード実装・focused D1 Vitest・正本 API spec 書き込みは完了。`@ubm-hyogo/api` typecheck・repo lint は本サイクルで実行し、commit / push / PR・staging runtime smoke・**production tag 強制移行・物理削除**は user-gated のまま残す。

## Phase 12 タスク実施状況（Task 12-1〜12-6）

| Task | 内容 | 実施状況 |
| --- | --- | --- |
| Task 12-1 | 正本 spec 同期（`specs/01-api-schema.md`） | **完了**。`?migrateTo` endpoint / error code 3 種 / audit action / 不変条件を正本へ反映 |
| Task 12-2 | 実装ガイド作成（Part 1 概念 / Part 2 技術） | **完了**。`implementation-guide.md` に型・関数・route・audit・SQL・test・DoD・視覚証跡を記載 |
| Task 12-3 | ドキュメント変更履歴（全 Step） | **完了**。`documentation-changelog.md` に Step 1-A/1-B/1-C/Step 2 + workflow-local / global skill sync を分離記録 |
| Task 12-4 | 未タスク検出（current / baseline 分離・0 件でも出力） | **完了**。`unassigned-task-detection.md`。current 新規 0 件、baseline は親 issue-1070 で既に formalize 済みを参照のみ |
| Task 12-5 | スキルフィードバック | **完了**。`skill-feedback-report.md`。テンプレ/ワークフロー/ドキュメント観点、no-op reason / evidence path 付き |
| Task 12-6 | compliance check（canonical 9 見出し） | **完了**。`phase12-task-spec-compliance-check.md`（別途確定済み） |

## strict 7 + runbook 成果物

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `main.md` | 本ファイル（Phase 12 概要 + close-out 状態 + Task 12-1〜12-6 実施状況） |
| 2 | `implementation-guide.md` | Part 1（概念説明）/ Part 2（型・関数・route・audit・SQL・test・DoD） |
| 3 | `system-spec-update-summary.md` | `specs/01-api-schema.md` への `?migrateTo` / error code / audit action 同期差分 + 不変条件 |
| 4 | `documentation-changelog.md` | 作成 doc 一覧（index / artifacts / phase 1-13 / runbook）と全 Step の結果 |
| 5 | `unassigned-task-detection.md` | 未タスク検出（current 0 件・baseline は親 issue-1070 で formalize 済み参照） |
| 6 | `skill-feedback-report.md` | FB-I1117-001..005 |
| 7 | `phase12-task-spec-compliance-check.md` | strict 7 / 4 条件 / evidence check（canonical 9 見出し・別途確定済み） |
| + | `force-migration-runbook.md` | AC-6 runbook（移行前 snapshot 保全 + 強制移行手順 + 逆移行 dest→src ロールバック + user gate） |

## close-out 判定

- `workflow_state` = **`implemented_local_evidence_captured`**（local 実装・focused D1 Vitest・正本 API spec 同期済み）
- Issue #1117 = **CLOSED 維持**（reopen しない・PR 作成時も `Refs #1117`）
- Gate-A = **passed**（Phase 1-3 設計凍結）／ Gate-B = **passed**（local implementation + focused evidence）／ Gate-C = **pending_user_approval**（commit / push / PR / staging runtime / production mutation）
- visualEvidence = **NON_VISUAL**（API only / `apps/web` 非接触。Phase 11 screenshot 不要）
- 不可逆区分 = **`physical deletion 2-stage`**（endpoint コード + 強制移行 + 参照ガード + COUNT=0 再検証 + audit + tests は実装可能・production 強制移行/物理削除 runtime のみ不可逆 user-gated）
- `governance_mutation_user_gate` = **true**

## 凍結した実装契約（SSOT・Phase 2/3）

| 層 | 追加 |
| --- | --- |
| repository | `migrateMemberTagReferences(c,src,dest)→{sourceReferenceCount,migratedCount}` / `forceMigrateAndPhysicalDeleteTagDefinition(c,src,dest)→ForceMigrateAndPhysicalDeleteTagResult`。既存 `countMemberTagReferences` / `physicalDeleteTagDefinition` / `getTagDefinitionByIdRaw` を再利用 |
| route | `DELETE /admin/tags/:tagId/physical?migrateTo=<dest>`（強制移行の二段）。`migrateTo` 未指定は issue-1070 既存挙動を完全保持（AC-7）。`ERROR_TO_STATUS` に `migration_target_not_found:404` / `migration_target_inactive:409` / `migration_target_same_as_source:400` |
| audit | `admin.tag.references_migrated`（before=`{tag_id:src, dest, referenceCount}` / after=`{migratedCount, deleted:true}`）+ 既存 `admin.tag.physically_deleted` |
| SQL | `INSERT OR IGNORE INTO member_tags(member_id,tag_id,source,confidence,assigned_at,assigned_by) SELECT member_id,?dest,source,confidence,assigned_at,assigned_by FROM member_tags WHERE tag_id=?src` → `DELETE FROM member_tags WHERE tag_id=?src` を `c.db.batch` で実行。`migratedCount`=移行前 source 参照数。`member_tags` は FK なし（PK(member_id,tag_id) のみ） |
| test | `tagDefinitions.write.repository.spec.ts`（D1）/ `tags.contract.spec.ts`（force-migration + AC-7 regression 固定） |
| spec doc | `specs/01-api-schema.md` に `?migrateTo` endpoint + error code 3 種 + audit action + 不変条件 |
| migration | 不要（移行は runtime データ操作。移行先は実行時指定ゆえ固定 DDL では表現不能） |

## local evidence

| 検証 | 結果 |
| --- | --- |
| focused D1 Vitest | PASS。2 files / 25 tests（force-migration + AC-7 regression） |
| API typecheck | PASS: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| repo lint | PASS: `mise exec -- pnpm lint` |
| 正本 API spec | `docs/00-getting-started-manual/specs/01-api-schema.md` 同期済み |

## user-gated 境界

staging deploy / runtime smoke・commit / push / PR・**production tag 強制移行・物理削除**・Issue #1117 状態変更は user-gated。local code / focused tests / typecheck / lint / 正本 spec sync は同一サイクル対象であり、user-gated にはしない。詳細手順は `force-migration-runbook.md`（production 強制移行 + 逆移行ロールバック）と `outputs/phase-13/phase-13.md`（commit / push / PR）。
