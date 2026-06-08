# Phase 12: ドキュメント（main index）

> workflow: `issue-1126-bulk-tag-picker-viewport-baseline-expansion`
> workflow_state: `implemented_local_runtime_pending`（本実行サイクルで実装済み）
> visual 区分: `VISUAL_ON_EXECUTION`
> issue: #1126（CLOSED 維持・`Refs #1126` のみ付与）

---

## Phase 12 概要

bulk tag picker（`/admin/members` 一括操作リージョン内のタグ一括付与・解除 picker）の
authenticated staging visual baseline を、現状の desktop 単一 viewport から
mobile / tablet / wide の 3 viewport へ additive 拡張する実装仕様書の Phase 12 成果物群。

本タスクは **実装仕様書（CONST_004）** であり、本フェーズではコードを実装済み。
workflow_state は `implemented_local_runtime_pending`。実コード差分・typecheck・lint・focused test・Phase 12 compliance は完了、staging visual capture・
`--update-snapshots`・commit・push・PR・issue mutation は全て user-gated。

設計は B案（per-test viewport 切替 + snapshot 名 viewport suffix）。
`apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
内で `page.setViewportSize()` を切替え、mobile(390×844) / tablet(768×1024) / wide(1920×1080) の
3 viewport × assign/unassign の **新規 baseline 6 枚** を追加する。既存 desktop(1280×800) 無 suffix
baseline 2 枚は温存。fixture `apps/web/playwright/fixtures/viewports.ts` に `wide` を additive 追加。

---

## strict 7 成果物一覧

| # | 成果物 | リンク | 役割 |
|---|--------|--------|------|
| 1 | main.md | [main.md](./main.md) | Phase 12 main index（本ファイル） |
| 2 | implementation-guide.md | [implementation-guide.md](./implementation-guide.md) | CONST_005 実装ガイド（Part 1 中学生向け説明 + Part 2 技術手順） |
| 3 | phase12-task-spec-compliance-check.md | [phase12-task-spec-compliance-check.md](./phase12-task-spec-compliance-check.md) | canonical 9 見出しの準拠チェック |
| 4 | system-spec-update-summary.md | [system-spec-update-summary.md](./system-spec-update-summary.md) | システム仕様書（specs/）への影響（N/A）と理由 |
| 5 | skill-feedback-report.md | [skill-feedback-report.md](./skill-feedback-report.md) | テンプレ/ワークフロー/ドキュメント 3 観点の skill フィードバック |
| 6 | unassigned-task-detection.md | [unassigned-task-detection.md](./unassigned-task-detection.md) | 未タスク検出（0 件）と判定根拠 |
| 7 | documentation-changelog.md | [documentation-changelog.md](./documentation-changelog.md) | 本 WF で作成したドキュメント一覧と consumed pointer |

---

## workflow_state 判定（implemented_local_runtime_pending）

| source | 値 | 一致 |
|--------|-----|------|
| `index.md` front-matter | `implemented_local_runtime_pending` | ✅ |
| root `artifacts.json` `status` / `metadata.workflow_state` | `implemented_local_runtime_pending` | ✅ |
| `outputs/artifacts.json` | `implemented_local_runtime_pending`（root と byte-identical） | ✅ |
| 本 main.md | `implemented_local_runtime_pending` | ✅ |
| `phase12-task-spec-compliance-check.md` | `implemented_local_runtime_pending` | ✅ |

- phase status: phase-1〜13 = `implemented_local_runtime_pending`。実コード実装済み・実 PNG 未取得。
- Gate: Gate-A=passed（spec_review）/ Gate-B=passed（local implementation・runtime visual pending）/ Gate-C=pending（external_ops）。Gate-B の status enum は schema 制約により `passed`、runtime visual pending の含意は §7 boundary で表現。
- Phase 11 evidence は実 PNG 未取得のため compliance check の §4 で全行 Status=`pending`。

---

## 完了サマリ

- 実装区分: 実装仕様書（CONST_004）。1 サイクルスコープ（CONST_007）= spec 1 本 + fixture 1 本の編集。
- 設計確定: B案（per-test viewport 切替）。A案（viewport 別 project 複製）は config 肥大のため不採用。
- 既存資産再利用: viewport 値は `viewports.ts` を正本にし `wide` のみ additive。desktop 無 suffix baseline 温存。
- read-only 維持: タグ apply なし、`bulk-tag-result` count 0 assert、共有 staging D1 への副作用ゼロ。
- CI 無改修: `staging-visual-authenticated` project が glob で spec を拾い、新 baseline は自動で回帰検出に参加。
- 全外部操作（staging capture・`--update-snapshots`・commit・push・PR・issue mutation）は user-gated。

補助成果物として `phase-12.md` も present だが、strict 7 の構成要素には含めない。
