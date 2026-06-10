# 仕様更新判定（Step1-A / 1-B / 1-C / Step2）

- task_id: `public-home-member-card-info-and-tag-clarity`
- status: **implemented_local_evidence_captured**（実コード・仕様反映まで完了）

## Step1: workflow-local 仕様の更新判定

| Step | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| Step1-A | 要件（AC）の変更有無 | **反映済み** | AC-1..AC-9 は Phase 1 で確定済み。実装結果も同 AC に trace |
| Step1-B | 設計（型 / シグネチャ / lane）の変更有無 | **反映済み** | `tag-display.ts` / `businessSummary` projection / shared zod/type を実装 |
| Step1-C | テスト / 検証手順の変更有無 | **反映済み** | focused Vitest 6 files / 50 tests PASS。local visual PNG を Phase 11 に追加 |

## Step2: 公開仕様（システム全体）への反映判定 — **更新要**

本タスクは公開 API 出力契約に新規フィールドを追加するため、Step2 は **更新要**。

### 反映対象

- **新規 interface 追加点**: `PublicMemberListItem` に optional `businessSummary: string` を追加（list endpoint の出力契約に項目追加）。
  - `packages/shared/src/zod/viewmodel.ts` の `PublicMemberListItemZ`（.strict()）へ `businessSummary: z.string().optional()`。
  - これは公開 API（`GET /public/members`）の list item 出力 shape を拡張する変更であり、仕様書への記載対象。
- 補足: AC-1/AC-7 の矢印正規化と AC-2/AC-4 の curated タグ表示は **web 表現層のみ**（API 出力 shape は不変）のため Step2 反映対象外。

### 反映済み正本

| ドキュメント | 反映内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | list item 出力（`GET /public/members`）に optional `businessSummary`（businessOverview 先頭 1 行・server cap 120 字）を追記 |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | 旧「businessOverview/tags は一覧 item contract に存在しない」前提を、`businessSummary` + opt-in `tags` の現行 contract に更新 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` | public members response extension と workflow 実装状態を同期 |

### 注記

- 既存 API endpoint surface は不変（新 endpoint なし）。`businessSummary` は既存 `response_fields` カラム由来の projection 追加であり、D1 schema / Google Form 変更は伴わない（AC-9）。
