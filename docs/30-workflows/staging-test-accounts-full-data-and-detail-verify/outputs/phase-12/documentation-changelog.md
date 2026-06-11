# Documentation Changelog

## 2026-06-09

本 wave で作成・更新したドキュメント（workflow spec 一式）を以下に列挙する。本タスクは `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` であり、**local コード実装・seed 生成物再生成・focused tests まで完了**した。staging D1 apply / authenticated staging スクリーンショット取得 / commit / push / PR のみ user-gated 実行へ残す。

### 作成したワークフロー spec（workflow-local）

- `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/index.md`（設計 SSOT・全設計 / 変更ファイル / DoD）
- `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/_shared-context.md`（SubAgent 共有 SSOT）
- `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/artifacts.json`（root）
- `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/outputs/artifacts.json`（mirror・root と byte 一致）
- `outputs/phase-1/phase-1.md`（要件定義・completed）
- `outputs/phase-2/phase-2.md`（設計・completed）
- `outputs/phase-3/phase-3.md`（設計レビュー・completed）
- `outputs/phase-4/phase-4.md`（テスト作成・implemented_local_evidence_captured）
- `outputs/phase-5/phase-5.md`（実装手順・implemented_local_evidence_captured）
- `outputs/phase-6/phase-6.md`（テスト拡充・implemented_local_evidence_captured）
- `outputs/phase-7/phase-7.md`（カバレッジ確認・implemented_local_evidence_captured）
- `outputs/phase-8/phase-8.md`（リファクタリング・implemented_local_evidence_captured）
- `outputs/phase-9/phase-9.md`（品質保証・implemented_local_evidence_captured）
- `outputs/phase-10/phase-10.md`（最終レビュー・implemented_local_evidence_captured）
- `outputs/phase-11/phase-11.md`, `outputs/phase-11/manual-test-result.md`（手動テスト計画・VISUAL_ON_EXECUTION・PNG pending）
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-13/phase-13.md`（PR 作成・pending_user_approval）

### Step 別結果（全 Step を個別明記・該当なしも記録）

| Step | 結果 |
| --- | --- |
| Step 1-A: 完了タスク記録 | 本 wave は実装仕様書（implemented_local_evidence_captured）として、local 実コード・seed 生成物・focused tests 完了まで記録 |
| Step 1-B: 実装状況テーブル | 変更対象ファイルを `implemented_local_evidence_captured`（local 実装・検証済み）として記録 |
| Step 1-C: 関連タスク | `test-accounts-seed-spec`（基盤）・`public-member-detail-survey-fields-richness`（描画継続）・commit `66d18af1b` を参照先として記録。契約の引き継ぎは **該当なし**（基盤再利用・別関心なし） |
| Step 2: 新規インターフェース sync | **N/A**（新規 API / D1 schema / migration / Form schema / 公開型なし）。global skill sync は今回のlocal実装着手時の同 wave 同期方針のみ記述 |

### workflow-local 同期（本 wave で実施）

| 対象 | パス | 状態 |
| --- | --- | --- |
| Phase 11 計画 + 結果メタ | `outputs/phase-11/*` | present（VISUAL・PNG pending） |
| Phase 12 strict 7 | `outputs/phase-12/*` | present |
| root / outputs artifacts parity | `artifacts.json` / `outputs/artifacts.json` | byte 一致（implemented_local_evidence_captured） |

### global skill sync（本 wave 未実施・今回のlocal実装着手時の同 wave 同期方針）

| 対象 | パス | 状態 |
| --- | --- | --- |
| aiworkflow active task ledger | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 今回のlocal実装着手時に追記予定（本 wave 未更新） |
| aiworkflow quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 同上 |
| aiworkflow resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 同上 |
| aiworkflow artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-staging-test-accounts-full-data-and-detail-verify-artifact-inventory.md` | 同上（新規作成予定） |

> global skill sync を本 wave で未実施とするのは、implemented_local_evidence_captured かつ新規 I/F なし（Step 2 = N/A）であり、今回のlocal実装でコード実装が landed する同一ターンで artifact inventory / ledger を確定するほうが drift を生まないため。本 changelog にその方針を明記する。

### 表現の補正

- `visualEvidence` は `VISUAL_ON_EXECUTION`、`visualEvidenceStatus` は `staging_visual_pending_user_gate` として統一（Phase 11 はスクリーンショット pending・PNG 0）。
- workflow_state は root / outputs / index.md / Phase status のすべてで `implemented_local_evidence_captured` に統一（Phase 13 のみ `pending_user_approval`）。
- local 実装済みの事実（catalog / build-seed-sql / seed artifacts / fixture / adapter spec）は完了形で記述し、staging apply / screenshot / commit / PR は user-gated として区別する。
