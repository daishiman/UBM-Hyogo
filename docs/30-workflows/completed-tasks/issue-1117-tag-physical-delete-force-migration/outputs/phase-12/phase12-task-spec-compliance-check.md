# phase12-task-spec-compliance-check

> Phase 12 がタスク仕様書どおりに実行されたかを root evidence 1 ファイルへ集約する。canonical 見出し 1..9 は逐語。

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | `TASK-ISSUE-1117-PHYSICAL-DELETE-FORCE-MIGRATION` |
| タスク名 | tag physical delete force-migration（参照付き tag の強制移行） |
| workflow | `docs/30-workflows/completed-tasks/issue-1117-tag-physical-delete-force-migration` |
| 実施日 | 2026-06-06 |
| 判定 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING（implemented_local_evidence_captured） |
| 対象未タスク | なし（current 0 件・detail は §未タスク参照） |

## 1. Summary verdict

- 判定: **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING**（local 実装・focused evidence・正本 spec 同期済み。staging runtime / production mutation / commit / PR は user-gated）。
- 本成果物は **implemented_local_evidence_captured** であり、コード実装・focused tests・正本 API spec 同期は完了。commit・PR・staging runtime・production mutation は user-gated。
- Issue #1117 は **CLOSED 維持**（reopen しない）。
- 強制移行は本サイクルで `apps/api` に実装済み。issue-1070 の 409 拒否経路を温存する contract test で AC-1..AC-7 を固定。

## 2. Changed-files classification

| 区分 | パス | 種別 |
| --- | --- | --- |
| spec（新規） | `docs/30-workflows/completed-tasks/issue-1117-tag-physical-delete-force-migration/**` | 仕様書一式（index + phase 1-13 + artifacts × 2 + phase-12 strict 7 + runbook） |
| 実装 | `apps/api/src/repository/tagDefinitions.ts` | `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` |
| 実装 | `apps/api/src/routes/admin/tags.ts` | `?migrateTo` 分岐 + error code 3 種 + audit action |
| tests | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | force-migration repository D1 cases |
| tests | `apps/api/src/routes/admin/tags.contract.spec.ts` | force-migration contract + AC-7 regression |
| 正本 spec | `docs/00-getting-started-manual/specs/01-api-schema.md` | endpoint query / error code / audit action / 不変条件を同期 |

- `apps/` 配下のコード変更あり。CONST_004/005 により local 実装まで同一サイクルで完了。

## 3. `workflow_state` and phase status consistency

- `metadata.workflow_state` = `implemented_local_evidence_captured`、`metadata.implementation_status` = `implemented_local_evidence_captured`、top-level `status` = `implemented_local_evidence_captured`。
- Phase 1-12 outputs は physically present（spec authored）。Phase 13（commit-pr-release）は `pending_user_approval`。
- `artifacts.json` と `outputs/artifacts.json` は structured update で同一 state / gates / phase status に同期済み。`cmp -s artifacts.json outputs/artifacts.json` は outputs 側の追加 ledger を許容する構造差分のため parity 判定対象にせず、同一キー（status / workflow_state / implementation_status / gates / phases）の一致を確認対象とする。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| screenshot | n/a | n/a |

- NON_VISUAL（API only / `apps/web` 非接触）のため screenshot は `n/a`。
- focused D1 Vitest は Phase 11 primary evidence として取得済み。`manual-test-result.md` は NON_VISUAL 宣言と 2 files / 25 tests PASS を保持。

## 5. Phase 12 strict 7 file inventory

| # | File | 状態 |
| --- | --- | --- |
| 1 | outputs/phase-12/main.md | present |
| 2 | outputs/phase-12/implementation-guide.md | present |
| 3 | outputs/phase-12/system-spec-update-summary.md | present |
| 4 | outputs/phase-12/documentation-changelog.md | present |
| 5 | outputs/phase-12/unassigned-task-detection.md | present |
| 6 | outputs/phase-12/skill-feedback-report.md | present |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | present（本ファイル） |

- 追加成果物: `outputs/phase-12/force-migration-runbook.md`（AC-6 逆移行ロールバック方針）。

## 6. Skill/reference/system spec same-wave sync

- 本成果物は **implemented_local_evidence_captured**。`docs/00-getting-started-manual/specs/01-api-schema.md` の正本同期は完了。
- aiworkflow-requirements には workflow artifact inventory / task-workflow-active を同一 wave で同期する。
- system-spec-update-summary.md に「正本 spec 差分（不変条件・endpoint・error code・audit action）」の反映結果を記録済み。

## 7. Runtime or user-gated boundary

- 本サイクル完了範囲: local implementation、focused D1 Vitest、正本 API spec 同期、workflow docs（index + phase 1-13 + artifacts × 2 + strict 7 + runbook）の作成。
- user-gated: staging runtime smoke、production tag 強制移行・物理削除 mutation、commit、push、PR、Issue 状態変更。
- 不可逆区分: `physical deletion 2-stage`。強制移行・物理削除の production runtime のみ不可逆 → user gate + runbook で保護。

## 8. Archive/delete stale-reference gate

- 旧参照の削除・アーカイブは本サイクルでは発生しない（新規 workflow dir のみ作成）。
- source unassigned-task（`docs/30-workflows/unassigned-task/task-issue-1070-followup-001-physical-delete-force-migration.md`）は、commit/PR close-out 境界で completed-tasks へ移動 / consumed 記録する（本サイクルでは commit/PR 禁止のため移動しない）。stale 参照 0 件。

## 8.5 30-method compact evidence

- システム思考: 強化ループ（強制移行 → tag master 健全性）/ バランスループ（不可逆削除 → user gate 抑制）を Phase 3 §3.4 に明記。
- 因果・境界: route → repository の状態所有権集約。`apps/web` 非接触。schema 不変。
- 価値とコスト: 価値=誤付与クリーンアップ、最大コスト=不可逆削除安全担保 → runbook + user gate に分離。
- 改善優先順位: AC-7 退化防止 > 孤児化禁止 > 移行先検証 > audit > runbook。

## 9. Four-condition verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 誤付与 tag の参照を正しい tag へ寄せてから完全削除する運用需要を満たす |
| 実現性 | PASS | issue-1070 の physical delete + audit + contract test に前例。migration 不要。標準 SQL |
| 整合性 | PASS | 409 拒否経路温存・孤児化禁止・移行後 COUNT=0 再検証・状態所有権を repository に集約 |
| 運用性 | PASS | audit に件数/src/dest/actor 記録・runbook に逆移行・production は user gate |

> 3-state verdict vocabulary: 本チェックは PASS 単独ではなく各条件に根拠を付して PASS 判定。FAIL / CONDITIONAL 該当なし。
