`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 12 — システム仕様更新サマリ（system-spec-update-summary）

本タスクは `implemented_local_evidence_captured` であり、各 Step の結果を「該当なし」も含めて個別に記録する。

## Step 1-A — 完了タスクの記録

| 項目 | 内容 |
| --- | --- |
| タスクID | `issue-1076-member-og-design-token-alignment` (FU-I1027-002) |
| 完了範囲 | Phase 1-13 の実装仕様書作成、`apps/og` 実装、focused tests、typecheck/lint、dry-run build、size gate |
| 記録先 | 本 workflow root（`index.md` / `artifacts.json` / `outputs/`）、aiworkflow-requirements active guide / indexes / artifact inventory / changelog / LOGS |
| 実コード差分 | あり。`apps/og` の派生トークン・render HTML・回帰テストを同一サイクルで実装 |

> staging 実PNG screenshot、commit、push、PR、Issue mutation は user-gated として分離する。

## Step 1-B — 実装状況テーブル

| 対象 | 実装区分 | 状態 |
| --- | --- | --- |
| `apps/og/src/og-tokens.ts`（新規） | 実装仕様書 | `implemented_local_evidence_captured`（実装済み） |
| `apps/og/src/render.tsx`（編集） | 実装仕様書 | `implemented_local_evidence_captured`（実装済み） |
| `apps/og/src/__tests__/og-tokens.spec.ts`（新規） | 実装仕様書 | `implemented_local_evidence_captured`（実装済み） |
| `apps/og/src/__tests__/render-html.spec.ts`（編集） | 実装仕様書 | `implemented_local_evidence_captured`（実装済み） |
| `apps/og/src/__tests__/render-smoke.spec.ts`（編集） | 実装仕様書 | `implemented_local_evidence_captured`（実装済み） |

> 全行 `implemented_local_evidence_captured`。landed / deployed は未記載（commit/push/PR/deploy 未実行）。

## Step 1-C — 関連タスク

| 関連 | 関係 | 状態 |
| --- | --- | --- |
| 親 `issue-1027-member-dynamic-og-worker-split`（#1027 / 実装 #1084） | OG Worker 分離の本体。本タスクが意匠整合の対象とする | completed（`completed-tasks/`・read-only 参照のみ） |
| 検出元 親 `outputs/phase-12/unassigned-task-detection.md` | 本タスクの出自（将来候補表） | read-only 参照 |
| デザイン正本 `apps/web/src/styles/tokens.css` | 色の SSOT。本タスクは派生 hex を複製するのみ・正本は不変 | 不変 |

## Step 2 — aiworkflow-requirements 正本（system spec）更新

| 項目 | 判定 |
| --- | --- |
| 新規公開 interface / 型 / API 追加 | **なし（N/A）** |
| 理由 | 追加するのは `apps/og` 内部の定数（`OG_BRAND` / `OG_TYPO` / `OG_LAYOUT`）と内部 helper（`titleFontSize`）のみ。OG endpoint surface・公開契約・IPC/Bridge API・型契約のいずれも変更しない |
| aiworkflow-requirements 正本更新 | **不要** |
| 根拠 | OG 内部定数の正本化は workflow-local の設計事項であり、横断仕様（`references/`）への反映対象でない |

> Step 2 は新規 interface 追加なしのため N/A。aiworkflow-requirements `references/` の system spec 更新は不要。
