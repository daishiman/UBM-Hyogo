# Phase 12: ドキュメント更新

> **[実装区分: 実装仕様書]**（CONST_004 デフォルト）。本 Phase はタスク完了に伴うドキュメント更新・システム仕様反映・未割当タスク検出・skill フィードバックを確定する。本 workflow は `implemented_local_runtime_pending`（実コード配線・ローカル focused test/typecheck・local visual evidence 完了、staging/R2 実 URL capture は user-gated）であり、本 Phase の成果物は implementation close-out evidence として物理配置する。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / implementation_mode: `new` / visualEvidence: `VISUAL_ON_EXECUTION`
- GitHub Issue: #1029（**CLOSED** のまま仕様作成 / reopen しない / mutation 無し）
- Phase 12 strict 7: `outputs/phase-12/` に物理配置（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- Gate-A: passed（spec authored）/ Gate-B: passed（implementation 未着手・user-gated）/ Gate-C: pending（external ops・user-gated）

## 目的

issue #1029（public member photo display）のタスク仕様書（Phase 1-13）と実コード実装完了に伴い、(1) 実装者向けガイド、(2) システム仕様への反映、(3) ドキュメント変更記録、(4) 未割当タスク検出、(5) skill フィードバック、(6) タスク仕様準拠チェックを `implemented_local_runtime_pending` の現在事実で確定する。本 Phase では実コード変更済みの状態をドキュメント・正本仕様へ同期する。写真公開 policy ADR と aiworkflow-requirements 逆引き索引は同一 wave で反映済み。

## 実行タスク

- `outputs/phase-12/implementation-guide.md` を作成する。Part 1（中学生レベルの概念説明）と Part 2（型・API シグネチャ・presign・fail-soft・設定パラメータ）を含める。識別子は実コード由来（`PublicMemberListItemZ` / `listMemberPhotosByIds` / `resolvePhotoUrls` / `resolvePhotoUrl` / `presignMemberPhotoGetUrl`）で記載する。
- `outputs/phase-12/system-spec-update-summary.md` を作成する。Step 1-A（完了タスク記録 = implemented_local_runtime_pending）/ Step 1-B（実装状況テーブル = implemented）/ Step 1-C（関連タスク = #983 完了・#983-followup-001/003 別タスク）/ Step 2（新規 public `photoUrl` インターフェースの api-endpoints 反映）を記録する。workflow-local 同期と global skill sync を別ブロックで記録する。
- `outputs/phase-12/documentation-changelog.md` を作成する。Step 1-A/1-B/1-C/Step 2 の結果を個別明記する。実コード変更・policy ADR・aiworkflow-requirements 索引の反映を明記する。
- `outputs/phase-12/unassigned-task-detection.md` を作成する。ソース別（元タスク スコープ外 / Phase 10 MINOR / Phase 11 / TODO / describe.skip）に確認し、baseline（#983-followup-001 self-upload / -003 transcode）と current（本 task で新規発生した gap）を分離記録する。current 新規未タスクは 0 件である。
- `outputs/phase-12/skill-feedback-report.md` を作成する。テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点を記録する。
- `outputs/phase-12/phase12-task-spec-compliance-check.md` を作成する。canonical 9 見出しを逐語で含め、Phase 11 evidence file inventory テーブルと Phase 12 strict 7 file inventory を記載する。
- `outputs/phase-12/main.md` を作成する。Phase 12 全体サマリを記録する。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 本実装サイクルでの public `photoUrl` 実装時に、以下のシステム仕様を確認して既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | public member API contract（`photoUrl` 追加反映先） |
| public exposure policy | `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md` | 写真公開 gate / TTL / R2 read boundary |
| security | `.claude/skills/aiworkflow-requirements/references/security-api.md` / `.claude/skills/aiworkflow-requirements/references/security-principles.md` | PII / consent 境界（写真公開 gate の整合確認先） |

- `index.md`（§0 ベースライン / §1 スコープ / §2 AC）
- `phase-1.md` / `phase-2.md` / `phase-3.md` / `phase-4.md` / `phase-8.md`
- `outputs/phase-1/spec-extraction-map.md`
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/`（upstream close-out 様式）
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`

## 成果物

- Phase 12 ドキュメント更新（本ファイル）
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] implementation-guide.md が Part 1（中学生レベル）と Part 2（技術者レベル）の 2 構成で作成され、識別子が実コード由来である
- [ ] system-spec-update-summary.md が Step 1-A/1-B/1-C/Step 2 を記録し、workflow-local 同期と global skill sync を別ブロックで分離している
- [ ] documentation-changelog.md が全 Step の結果（該当なしを含む）を個別明記し、implemented_local_runtime_pending の実コード反映を記録している
- [ ] unassigned-task-detection.md が baseline と current を分離記録し、current 新規未タスク 0 件を記録している
- [ ] skill-feedback-report.md が 3 観点を記録している
- [ ] phase12-task-spec-compliance-check.md が canonical 9 見出しを逐語で含み、Phase 11 evidence inventory テーブル（Status は present/pending/n/a の 3 値）と Phase 12 strict 7 inventory を記載している
- [ ] main.md が Gate-A/B passed / Gate-C pending を記録している
- [ ] workflow_state=implemented_local_runtime_pending と phase status の一致が compliance-check に記録されている

## 統合テスト連携

本 Phase の compliance-check が CI gate `verify-phase12-compliance` の検査対象になる。Phase 11 evidence inventory は local screenshot を `present`、staging/R2 実 URL capture を Gate-C `pending_user_approval` として分離し、Phase 12 strict 7 inventory と整合させる。
