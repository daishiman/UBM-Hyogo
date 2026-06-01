# Phase 8: リファクタ

> docs-only タスクのためリファクタは最小。コードは存在せず、リファクタ対象は補正対象 JSON 内の
> **status 表記不統一の正規化**のみ。コード重複削除・抽象化は該当なし。

## 8.1 リファクタ範囲

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| Task A `artifacts.json` の `phases[].status` 値 | 13 件全て `spec_created`（他 sub-task と表記不統一）| Phase 1-12 = `completed` / Phase 13 = `pending` | sub-task 間で phase status の表記語彙を統一し、`spec_created` 混在を排除する（VC-R5 を満たす正規化）|
| Task B `artifacts.json` の `phases[11..12].status` | `pending`（Phase 1-10 は `completed`）| `completed` | Phase 11/12 evidence が実在し completed が事実。Task A/C と同じ「1-12 completed / 13 pending」形に揃える |
| Task C `artifacts.json` の `phases[].status` 値 | 13 件全て `pending` | Phase 1-12 = `completed` / Phase 13 = `pending` | page integration 実装済み。Task A/B と同じ形に揃える |
| root / sub-task の `status` / `workflow_state` / `implementation_status` | `spec_created`（3 種で同値）| `implemented_local_runtime_pending`（3 種で同値）| 3 フィールドの値同期を維持したまま current facts へ揃える（issue-976 等の完了タスク規約に整合）|

> 正規化方針: reconciliation 後の phase status 語彙は **`completed`（Phase 1-12）/ `pending`（Phase 13）** の 2 値に統一する。`spec_created` を phase status から排除する。

## 8.2 該当なし（明記）

| 候補 | 判定 | 理由 |
|------|------|------|
| コード重複削除 | 該当なし | `apps/` `packages/` のコードを変更しないため重複削除の対象が存在しない |
| 関数 / モジュール抽出 | 該当なし | 実装コード非変更 |
| 共通 helper 化 | 該当なし | 補正は値の点修正であり共通化する処理がない |
| JSON 構造（キー）の変更 | 行わない | top-level keys / metadata 構造 / gates 配列構造 / phases 配列構造は維持。値のみ補正（Phase 2 § 2.3 の構造維持方針に従う）|
| 新規ファイル作成 | 行わない | 既存ファイルの値編集のみ |

## 8.3 構造不変条件の再確認

- root の top-level keys（`created_at` / `implementation_mode` / `implementation_targets` / `metadata` / `phases` / `status` / `task_id` / `task_type` / `visual_category`）の追加・削除を行わない。
- gates 配列の要素数（Gate-A/B/C の 3 件）・順序を変更しない。
- phases 配列の要素数（13 件）・`phase` 番号・`name` / `output` フィールドを変更しない（`status` のみ補正）。
- `implementation_targets` 配列は変更しない。

## 8.4 apps/ 変更ゼロ

本 Phase のリファクタは正規化（JSON status 値の語彙統一）のみで、`apps/` `packages/` には一切触れない。
