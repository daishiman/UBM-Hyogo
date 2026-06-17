# Phase 12 — ドキュメント同期

## 目的

実装仕様（Phase 1-11）を踏まえ、ドキュメント同期の実施概要を固定する。本タスクは **implemented_local_evidence_captured**（実コード反映済み）であるため、workflow-local の strict 7 成果物作成、aiworkflow-requirements 同期、task-specification-creator skill feedback 反映を本サイクルで行う。

## 成果物

Phase 12 strict 7（`outputs/phase-12/` 配下・全て present）:

| # | path | 内容 |
| --- | --- | --- |
| 1 | [main.md](./outputs/phase-12/main.md) | Phase 12 サマリ + 検証コマンド一覧 |
| 2 | [implementation-guide.md](./outputs/phase-12/implementation-guide.md) | Part 1（中学生レベル）+ Part 2（開発者向け）2 部構成 |
| 3 | [system-spec-update-summary.md](./outputs/phase-12/system-spec-update-summary.md) | 新規インターフェース追加有無（API/型 不変） |
| 4 | [documentation-changelog.md](./outputs/phase-12/documentation-changelog.md) | Step 1-A/1-B/1-C / Step 2 を個別記録 |
| 5 | [unassigned-task-detection.md](./outputs/phase-12/unassigned-task-detection.md) | current（0 件）/ baseline（M-1/M-2/第二段階検出）分離 |
| 6 | [skill-feedback-report.md](./outputs/phase-12/skill-feedback-report.md) | skill 改善点 |
| 7 | [phase12-task-spec-compliance-check.md](./outputs/phase-12/phase12-task-spec-compliance-check.md) | canonical 9 見出しの compliance 照合 |

## Step 1 / Step 2 の判定

| Step | 対象 | 判定 |
| --- | --- | --- |
| Step 1-A | workflow-local doc（本 workflow root 配下） | 実施（Phase 1-13 + outputs 群を作成） |
| Step 1-B | global skill 反映（aiworkflow-requirements の active/index/inventory/changelog） | implemented_local_evidence_captured のため本サイクルで同期済み |
| Step 1-C | system spec（specs/*.md） | 該当なし（API/型/D1 不変・新規 spec 不要） |
| Step 2 | 新規インターフェース | 新規 UI 表現層 helper のみ（`matchedFieldLabel` / `IdentityConflictGuide` / `buildIdentityConflictSeedSql` 等）。**API surface 変更なし** |

## 未タスク方針

- **current = 0 件**（本サイクルで新たに生じた gap なし）。
- **baseline**: M-1（内部 member_id の完全隠蔽）/ M-2（`/admin/meetings` ページ本体 UX 改善）/ 第二段階検出（電話・住所一致）。いずれも API/D1 変更を伴う独立スコープのため本サイクルから分離（CONST_007 例外）。Issue 化は user 判断（PENDING）。詳細は [unassigned-task-detection.md](./outputs/phase-12/unassigned-task-detection.md)。

## 完了条件

- [x] strict 7 を全て作成した。
- [x] Step 1-A/1-B/1-C / Step 2 の判定を記録した。
- [x] 未タスク current/baseline を分離記録した。
- [x] skill 反映は本サイクルである旨を明記した。
