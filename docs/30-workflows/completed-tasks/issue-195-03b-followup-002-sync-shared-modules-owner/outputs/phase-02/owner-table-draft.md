# owner 表草稿（Phase 2）

| ファイル | owner task | co-owner task | 変更時の必須レビュアー | 備考 |
| --- | --- | --- | --- | --- |
| `apps/api/src/jobs/_shared/ledger.ts` | 03a | 03b | 03a / 03b | sync_jobs ledger 正本（start / succeed / fail / cursor / lock） |
| `apps/api/src/jobs/_shared/sync-error.ts` | 03a | 03b | 03a / 03b | sync 系 error code / リトライ可否 / metrics_json redact 正本 |

## 変更ルール（草案）

1. owner task の Phase 13 PR description に「co-owner への通知」セクションを必須で含める。
2. PR の reviewer に owner / co-owner を必ず指定。solo 開発でも本文に co-owner task ID を明示。
3. consumer task は変更を直接コミットせず、owner task で PR を起票。
4. 新規 `_shared/` モジュール追加時は本表に行を追加する PR を先行させる。
