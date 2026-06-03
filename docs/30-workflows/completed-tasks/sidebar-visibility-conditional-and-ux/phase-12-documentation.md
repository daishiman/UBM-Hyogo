# Phase 12: ドキュメント同期

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| workflow_state | `implemented_local_evidence_captured`（実装・local deterministic evidence・認証不要 local screenshot 4 PNG 完了。commit・PR・admin/staging screenshot は user-gated） |
| visual_category | VISUAL（local pixel screenshot 4 PNG 取得済み。staging/admin screenshot は user-gated） |
| 入力 | Phase 1-3（要件 / 設計 / 設計レビュー）/ Phase 10（最終レビュー）/ Phase 11（手動テスト計画） |
| 出力 | `outputs/phase-12/` strict 7 + 本サマリ |

## 目的

本 Phase は本ワークフロー（サイドバー表示条件の正本化 + SSR active 正確化 + viewer/active/badge UX）の
Phase 12 成果物を `outputs/phase-12/` 配下の **strict 7** に揃える実行ガイドである。
本件は **route topology / middleware / shell コンポーネントへのコード変更を伴う実装仕様書** であり、
本サイクルで実コード・direct focused tests・typecheck・lint・local pixel screenshot 4 PNG まで完了した。commit・PR・staging/admin screenshot は user-gated に残す。

正本仕様 09h §1.6 は既に「`/login`=shell 外 bare」を規定済みであり、本件はその正本へ実装を一致させる
**spec drift 解消**であると同時に、表示条件マトリクスへ `(auth)` route group を明示する **system spec 同期 Step 2 該当**である。

## 成果物一覧

| 成果物 | Path | 役割 |
| --- | --- | --- |
| main | [`outputs/phase-12/main.md`](outputs/phase-12/main.md) | Phase 12 全体サマリ・7 成果物索引 |
| implementation-guide | [`outputs/phase-12/implementation-guide.md`](outputs/phase-12/implementation-guide.md) | Part 1（例え話）/ Part 2（技術）|
| system-spec-update-summary | [`outputs/phase-12/system-spec-update-summary.md`](outputs/phase-12/system-spec-update-summary.md) | 09h §1.6 へ `(auth)` 反映の更新方針（Step 2 該当）|
| documentation-changelog | [`outputs/phase-12/documentation-changelog.md`](outputs/phase-12/documentation-changelog.md) | 全 Step 結果（該当なしも記録）|
| unassigned-task-detection | [`outputs/phase-12/unassigned-task-detection.md`](outputs/phase-12/unassigned-task-detection.md) | 未タスク検出（0 件でも出力）|
| skill-feedback-report | [`outputs/phase-12/skill-feedback-report.md`](outputs/phase-12/skill-feedback-report.md) | skill / template 改善（なしでも出力）|
| compliance check | [`outputs/phase-12/phase12-task-spec-compliance-check.md`](outputs/phase-12/phase12-task-spec-compliance-check.md) | canonical 9 見出し準拠確認 |

## システム仕様更新判定

本件は 09h §1.6 route → shell マトリクスへ **`(auth)` route group（`/login` = bare）を明示する Step 2 該当**である。
現行 09h §1.6 は login を「（shell 外）/ bare」と記載するが、route group 名（`(auth)`）が明示されておらず、
表示条件の単一所有者が route group であることがマトリクス上で可読化されていない。本件はこれを明示する。

| Step | 内容 | 本タスクでの結果 |
| --- | --- | --- |
| 1-A 完了記録 | 仕様書 / LOGS / 必要 skill 更新を同一ターンで反映 | `implemented_local_evidence_captured` として記録。local screenshot 4 PNG 取得済み、staging/admin screenshot は user-gated |
| 1-B 実装状況テーブル | `completed` / `implemented_local_evidence_captured` の判断 | `workflow_state: implemented_local_evidence_captured`。Phase 1-13 仕様と local evidence 完備 |
| 1-C 関連タスクテーブル | 参照 grep + 関連台帳再同期 | 親系譜 Task A/B/C/E・issue-1024 は dev マージ済み。本件はその差分修正 |
| Step 2 interface 追加 | 09h §1.6 マトリクスへ `(auth) /login bare` を明示 | **該当あり**。実反映済み |

## 参照資料

- Phase 1（要件定義）/ Phase 2（設計）/ Phase 3（設計レビュー）/ Phase 10（最終レビュー）/ Phase 11（手動テスト計画）
- 正本仕様: `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` §1.2 / §1.6
- strict 7: `outputs/phase-12/*.md`

## 完了条件

- [x] strict 7 を `outputs/phase-12/` に揃えた
- [x] システム仕様更新判定（09h §1.6 への `(auth)` 反映 = Step 2 該当）を明記した
- [x] Step 1-A/1-B/1-C/Step 2 を個別に記録した
- [x] implemented_local_evidence_captured 境界（pixel screenshot・commit・PR は user-gated）を明記した
