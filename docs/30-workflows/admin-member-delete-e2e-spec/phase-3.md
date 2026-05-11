# Phase 3: 設計レビュー（4-condition gate）

| 項目 | 値 |
|------|-----|
| レビュー日 | 2026-05-10 |

## 4-condition gate

| # | 条件 | 判定 | 根拠 |
|---|------|------|------|
| C1 | 単一責務（CONST_007） | OK | `route × test 種別` で 6 シナリオが直交。重複なし。Stage 2 sub-task 2a/2b/2d とも独立 |
| C2 | 不変条件遵守 | OK | 新 endpoint なし / 新 fixture なし / D1 直接アクセスなし / 色値直書きなし |
| C3 | 受け入れ基準が観測可能 | OK | SSR fixture gate、Client `page.route()`、DOM assertion で機械検証可能 |
| C4 | 依存（Stage 1 / API 実装）が明示 | OK | phase-1.md §2 で Stage 1 完了 / endpoint 実在を明記 |

## skip 許容ゲート（CONST_007 例外）

| 項目 | 内容 |
|------|------|
| 対象 | cascade preview test（test #2） |
| CONST_007 例外条件 | (1) 外部/未実装依存（cascade preview API 未実装） / (2) 後続 Stage 持越し明記 — **2 条件同時該当** |
| 持越し先 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/` |
| 復活条件 | Stage 3 で cascade preview API 実装後、`grep` で endpoint 実在を再確認の上 active 化 |
| spec 内記述 | `test.skip(...)` + `// TODO(stage-3): cascade preview API 未実装` コメント |

## risk register

| risk | mitigation |
|------|-----------|
| confirm dialog primitive のラベルがプロトタイプと差異 | Phase 4 で実装側 `apps/web/app/(admin)/admin/members/` の DOM を確認後 selector 確定 |
| `is_deleted` 表示の DOM 表現が未確定 | `getByText(/削除済み\|is_deleted/)` で OR 両対応 |
| API 422 のレスポンス shape が UI 側で未ハンドリング | UI E2E は disabled + API 到達 0、API 422 は backend contract 側に責務分離 |
| audit endpoint の sort 順依存 | mock fixture で順序を固定し sort 順非依存 |

## GO / NO-GO

| 観点 | 判定 |
|------|------|
| endpoint 実在 | OK（`member-delete.ts:44` / `audit.ts:144`） |
| UI route 実在 | OK |
| 6 シナリオすべて mock 戦略あり | OK（phase-2 §2） |
| skip 1 件の根拠が CONST_007 例外条件に整合 | OK |
| **判定** | **GO** |
