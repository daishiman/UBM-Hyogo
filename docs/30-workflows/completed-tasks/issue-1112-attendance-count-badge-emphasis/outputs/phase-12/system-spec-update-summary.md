# Phase 12 — システム仕様更新サマリ

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本ワークフローのシステム仕様（aiworkflow-requirements 等）への反映可否を Step 単位で判定する。

## Step 1-A — workflow-local 仕様の更新

| 判定 | 内容 |
| --- | --- |
| **該当あり** | 本ワークフロー配下（`docs/30-workflows/completed-tasks/issue-1112-attendance-count-badge-emphasis/`）の Phase 1-13 アウトプットを整備し、実コード実装と local 証跡を反映。 |

workflow-local の設計（`attendanceLevel` / `ATTENDANCE_LEVEL_THRESHOLDS` / `data-attendance-level` / scoped CSS）は
全て本 workflow dir 内に閉じる。外部 spec への昇格は不要。

## Step 1-B — 実装状況の記録

| key | value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured`（commit / PR 前） |
| implementation_mode | `new` |
| 実装ファイル | 5 ファイル（全て編集・新規ファイル無し） |
| 実装の実行状況 | **実施済み**（コード実装・focused Vitest・typecheck・verify-design-tokens・local Playwright screenshot PASS。commit・push・PR・staging deploy は user-gated） |

本 Step では local 実装が green になった状態を記録する。GitHub 操作と staging visual は完了扱いしない。

## Step 1-C — 公開ドキュメント / トークン仕様の更新

| 対象 | 判定 | 理由 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/design-tokens.md` | **該当なし（不変）** | 新規 OKLch トークンを追加しない。全色（`--status-success-bg` / `--status-neutral-bg` / `--ubm-color-accent-soft` / `--ubm-color-accent-ink` / `--ubm-color-text-secondary` / `--ubm-color-ok`）は既存。 |
| `apps/web/src/styles/tokens.css` | **該当なし（不変）** | トークン定義を追加・変更しない。 |
| プロトタイプ（`claude-design-prototype/`） | **該当なし** | 既存 primitives（`.ui-badge` + data 属性駆動色）の踏襲のみ。新規 primitive を生やさない。 |

## Step 2 — aiworkflow-requirements system spec への新規 interface/型/API 反映

| 判定 | **N/A（該当なし）** |
| --- | --- |

- 本タスクで追加する `attendanceLevel` / `ATTENDANCE_LEVEL_THRESHOLDS` / `AttendanceLevel` は、
  **admin feature 内部の helper export** に閉じる（`apps/web/src/features/admin/components/_meetings/meetingStats.ts`）。
- 公開 API surface（`apps/api/src/routes/`）・D1 schema・Google Form 仕様・認証境界・横断的に再利用される
  共有 interface のいずれにも変更が無い。
- したがって aiworkflow-requirements の system spec（公開 interface/型/API カタログ）へ新規追加する対象は無く、
  Step 2 は **N/A** と判定する。

## Step 3 — aiworkflow workflow index への同期

| 対象 | 判定 |
| --- | --- |
| quick-reference / resource-map / task-workflow-active | **反映済み** |
| workflow artifact inventory | **新規作成** |
| SKILL.md / SKILL-changelog | skill feedback 0 件のため変更なし |

## まとめ

| Step | 判定 |
| --- | --- |
| 1-A | 該当あり（workflow-local + 実装結果） |
| 1-B | `implemented_local_evidence_captured` を記録（commit / PR 前） |
| 1-C | 該当なし（design-tokens.md / tokens.css / プロトタイプ 不変） |
| 2 | N/A（admin 内部 helper の export 追加のみ・公開 interface/型/API 変更なし） |
| 3 | aiworkflow workflow index へ反映 |
