# Phase 12 — unassigned task detection

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 検出結果

| 項目 | 値 |
|------|----|
| 検出件数 | 0 件 |
| 候補列挙 | 下記 §1 に明示却下記録 |

## §1 候補と却下理由

| 候補 | 却下理由 |
|------|---------|
| `apps/api/wrangler.toml` 側に同種 regression test を追加 | 本 issue scope は apps/web に限定。apps/api 用は別 issue にて起票判断 |
| `apps/web/instrumentation.ts` 等のランタイム presence test | OpenNext build artifact 検証が範囲外 |
| `_worker.js` の .assetsignore 包含検証 | 現 `.assetsignore` には `_worker.js` 行がなく、OpenNext output 構造に依存するため AC として固定しない |
| `[observability]` 設定の存在検証 | UT-06-FU-A scope の不変条件ではないため対象外 |
| Wrangler version pin 検証 | バージョン管理は mise / package.json 側で別途。本 spec の責務外 |

## 結論

unassigned 0 件で確定。followup issue 起票も不要。

## source unassigned consumed trace

`docs/30-workflows/unassigned-task/UT-06-FU-A-open-next-config-regression-tests.md` は Issue #247 workflow で消化済みとして本文ステータスを `consumed_by_issue_247` に更新済み。正本 backlog の `UT-06-FU-A-INFRA-REGRESSION` 行も取り消し線付きの消化済み行へ更新し、未実施タスクとして残らないよう同期した。
