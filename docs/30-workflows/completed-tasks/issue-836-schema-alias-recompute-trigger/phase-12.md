# Phase 12: 正本同期（ドキュメント更新）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| 前 Phase | 11 (VISUAL evidence + runtime) |
| 次 Phase | 13 (PR・振り返り) |
| タスク種別 | implementation / VISUAL（admin UI screen diff あり） |
| 状態 | spec_created（runtime_pending） |
| implementation_mode | new |
| 親 Issue | #836（CLOSED, 2026-05-23T10:24:48Z）— reopen しない |

## このフェーズの責務

Issue #836 schema-alias-recompute-trigger の仕様書一式を作成したことに伴い、正本ドキュメント（system spec / workflow ledger / unassigned-task）を同波で同期し、CI gate `verify:phase12-compliance` の canonical heading 要件を満たす 7 必須 output を `outputs/phase-12/` に物理配置する。

本タスクは現時点で `spec_created`（local implementation complete・runtime evidence pending）だが、正本 spec ファイル（`11-admin-management.md` / `01-api-schema.md`）への recompute 仕様追記は本改善サイクルで実編集済みである。Phase 12 outputs は計画ではなく、実同期済みの差分要約と runtime evidence pending の境界を記録する。

## 必須 5 タスクの実施計画

| Task | 名称 | 出力 | 計画 |
| --- | --- | --- | --- |
| 12-0 | Phase 12 main summary | `main.md` | strict 7 parity 用の phase summary。6 詳細 outputs への入口 |
| 12-1 | 実装ガイド作成（2 パート構成） | `implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル）+ `## 視覚証跡`。設計正本は `outputs/phase-02/*.md` |
| 12-2 | システム仕様書更新（Step 1-A〜1-C + Step 2） | `system-spec-update-summary.md` | spec_created close-out。Step 1-A〜1-C を N/A にせず same-wave sync。Step 2 は recompute endpoint 2 本 + 型の新規追加を正本 spec へ実同期済み |
| 12-3 | ドキュメント更新履歴作成 | `documentation-changelog.md` | 仕様書 13 phase + spec 2 本 + unassigned-task fold-state の差分一覧 |
| 12-4 | 未タスク検出レポート作成 | `unassigned-task-detection.md` | 0 件ではなく bulk(006) / 通知(007) / Queue fan-out（新規候補）を列挙。重複起票しない |
| 12-5 | スキルフィードバックレポート作成 | `skill-feedback-report.md` | CLOSED issue を最新コードに最適化して仕様化するパターンの知見を記録 |
| 12-6 | compliance check 作成 | `phase12-task-spec-compliance-check.md` | canonical 9 見出し + Phase 11 evidence inventory + CONST 充足チェック |

## `spec_created` UI task の close-out ルール

本タスクは VISUAL（admin UI）かつ `spec_created` であるが、Phase 12 実行時に Step 1-A〜1-C を N/A にせず same-wave sync で閉じる。

| Step | `spec_created` での扱い |
| --- | --- |
| Step 1-A | 完了タスク記録 + LOGS.md x2（`docs/30-workflows/LOGS.md` / skill `LOGS.md`）+ topic-map を same-wave で更新 |
| Step 1-B | 実装状況テーブルに `spec_created` を記録する（`completed` ではない） |
| Step 1-C | 関連タスクテーブルのステータスを current facts へ更新 |
| Step 2 | recompute endpoint 2 本（POST / GET）+ 型（`RecomputeResult` / `RecomputeStatusResult` / `SchemaAliasRecomputeFailure`）の新規追加あり → `11-admin-management.md` / `01-api-schema.md` へ追記済み（AC-13） |

> 後からコード実装が入った場合の再判定: source workflow と `outputs/phase-12/*.md` を同一ターンで current facts へ戻し、Phase 11 evidence の `pending` → `present` reclassification を同波で行う。正本 spec 追記は済みなので、実装差分が発生した場合のみ追記内容を更新する。

## fold-state sync 方針

| 対象 | 方針 |
| --- | --- |
| 原典 unassigned-task | `docs/30-workflows/completed-tasks/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` の状態語彙セクションに `consumed_via_issue_836_recompute_trigger_spec` を追記（実装 close-out と同波） |
| Issue #836 | CLOSED 維持・reopen しない。本仕様書で local implementation + 正本同期まで完了する |
| followup-006 / 007 | 既存 unassigned-task に残置。重複起票しない |

## 7 outputs への導線

各 output は `outputs/phase-12/` 配下に配置する。

| ファイル | 内容 |
| --- | --- |
| [main.md](outputs/phase-12/main.md) | Phase 12 summary / strict 7 entrypoint |
| [implementation-guide.md](outputs/phase-12/implementation-guide.md) | Part 1/2 + 視覚証跡。Phase 13 `diff-to-pr` の参照源 |
| [system-spec-update-summary.md](outputs/phase-12/system-spec-update-summary.md) | Step 1-A〜1-C + Step 2 の差分要約 |
| [documentation-changelog.md](outputs/phase-12/documentation-changelog.md) | 本サイクル発生ドキュメント差分 |
| [unassigned-task-detection.md](outputs/phase-12/unassigned-task-detection.md) | 未タスク候補（0 件ではない） |
| [skill-feedback-report.md](outputs/phase-12/skill-feedback-report.md) | skill 改善フィードバック |
| [phase12-task-spec-compliance-check.md](outputs/phase-12/phase12-task-spec-compliance-check.md) | strict compliance check（root evidence） |

## DoD

- [ ] 7 必須 output を `outputs/phase-12/` に物理配置
- [ ] implementation-guide.md が Part 1 / Part 2 / `## 視覚証跡` を満たす
- [ ] phase12-task-spec-compliance-check.md が canonical 9 見出し + Phase 11 evidence inventory を満たす（`verify:phase12-compliance` pass）
- [ ] system-spec-update-summary.md が Step 1-A〜1-C + Step 2 を記録
- [ ] unassigned-task-detection.md が bulk / 通知 / Queue fan-out を列挙し重複起票しない
- [ ] fold-state sync 方針（`consumed_via_issue_836_recompute_trigger_spec`）を記述
- [ ] `artifacts.json` / `outputs/artifacts.json` parity 確認

## 次 Phase

- 次: 13（PR・振り返り。base=dev / user-gated push）
