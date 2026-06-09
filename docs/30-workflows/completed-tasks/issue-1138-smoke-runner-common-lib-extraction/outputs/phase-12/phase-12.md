# Phase 12: ドキュメント更新

## 目的

issue #1138 実装仕様書の strict 7 outputs を生成し、`implemented_local_evidence_captured` として close-out する。`scripts/smoke/` の 3 runner にコピー重複している共通機構を新規共通 lib `scripts/smoke/lib/smoke-common.sh` へ挙動非退化で抽出する refactoring の実装ガイド / spec sync / 未タスク検出 / skill feedback を完成させる。本サイクルでは仕様書（共通 lib の 9 関数シグネチャ・MECE 境界・移行手順・非退化テスト基準）の確定までを行い、コード実装・local test 実走・commit・PR は user-gated。

## strict 7 outputs

| # | ファイル | 状態 |
| - | -------- | ---- |
| 1 | `outputs/phase-12/main.md` | 作成済み（タスク要約 / 成果物 / 実装対象・実装済み / 状態） |
| 2 | `outputs/phase-12/implementation-guide.md` | 作成済み（Part 1 中学生レベル概念 + Part 2 bash 9 関数シグネチャ・入出力・エラー・定数一覧） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 作成済み（Step 1-A/1-B/1-C + Step 2 = aiworkflow-requirements 正本変更 N/A・smoke lib 公開 surface は workflow 内記録） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 作成済み（全 Step 個別明記 / workflow-local sync と global skill sync を別ブロック化） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 作成済み（current 0 件 + baseline 将来候補 + 関連タスク差分確認） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 作成済み（FB-1/2/3・改善観点あり） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 作成済み（canonical 9 見出し逐語） |

## Step 1-A〜1-C / Step 2（implemented_local_evidence_captured close-out）

- Step 1-A: タスク記録 — 本タスク root を 30-workflows ledger に `implemented_local_evidence_captured` で記録。親 `issue-1081-bulk-tag-real-d1-runtime-smoke`（3 本目 runner 追加元）の重複構造を SSOT 化する refactoring として位置付け。消費した未タスク `unassigned-task/task-issue-1036-followup-007-smoke-runner-common-lib-extraction.md` を Phase 12 で確認。
- Step 1-B: 実装状況テーブル — 仕様書 Phase 1-12 completed / 共通 lib・3 runner 移行・lib test・local evidence 取得完了（Gate-B passed）/ commit・PR pending（Gate-C）。
- Step 1-C: 関連タスクテーブル — 親 issue-1081（runner 雛形・変更しない）/ consumed unassigned（formalize）/ issue-1137（production runner 拡張・4 本目候補）/ 既存 3 runner（共通化対象）の関係を記録。
- Step 2: aiworkflow-requirements 正本（API/IPC/UI/auth/schema/Secret）への新規影響なし（**N/A**）。新規 public インターフェースは「内部開発者向けの bash lib 契約」であり、smoke lib 公開 surface は本 workflow 内に記録する。workflow registration / task-workflow-active は同期。

## 完了判定

- [x] strict 7 を全て生成（canonical 9 見出し逐語準拠）
- [x] implementation-guide.md を Part 1（中学生レベル概念）/ Part 2（bash 9 関数シグネチャ・入出力・エラー・定数）で実体付き作成（heading-only 回避）
- [x] Phase 11 evidence inventory を `Classification / Path / Status` テーブルで固定し、NON_VISUAL 代替証跡（local test / shellcheck）を 本サイクルで present と明記
- [x] Step 1-A〜1-C を implemented_local_evidence_captured 状態で close-out（Step 2 = aiworkflow-requirements 正本変更 N/A）
- [x] issue #1138 CLOSED 維持・コード実装と commit/PR は後続 / user-gated
