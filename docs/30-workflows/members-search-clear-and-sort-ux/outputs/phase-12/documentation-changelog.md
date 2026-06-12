# documentation changelog

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| workflow_state | implemented_local_runtime_pending |

## workflow-local block

| Step | 結果 | 詳細 |
|------|------|------|
| Step 1-A（既存 spec 追記） | 該当あり（軽微） | `docs/00-getting-started-manual/specs/01-api-schema.md` の `/public/members` sort 値に oldest / name_desc と ORDER BY を反映 |
| Step 1-B（新規 spec 作成） | 該当なし | 既存 spec 拡張で表現可能・新規ファイル不要 |
| Step 1-C（design-tokens / プロトタイプ） | 該当なし | 追加 CSS は色値を含まず tokens 影響なし |
| Step 2（用語・命名統一） | 該当あり | sort value 表記統一 + UI ラベル 4 種固定 + 五十音順非約束の明記 |

## global block（aiworkflow-requirements）

| 対象 | 結果 | 詳細 |
|------|------|------|
| topic-map | 該当なし | 新規トピック登録不要 |
| keywords.json | 該当なし | 新規キーワード登録不要 |
| L-ID lessons | 該当なし | 本ウェーブで新規 L-ID を追加しない |

## 備考

本ウェーブは implemented_local_runtime_pending。実コードへの反映、focused tests、Step 1-A / Step 2 の同期判定を同一サイクルで実施した。
