# Unassigned Task Detection — 02c-followup-002

## 結果

2 件を formalize した。どちらも本タスク内で無理に対応すると、既存 sync job ロジックや Cloudflare 実環境設定へ踏み込むため分離する。

| ID | path | 理由 |
| --- | --- | --- |
| `task-02c-followup-002-sync-forms-responses-test-baseline-001` | `docs/30-workflows/unassigned-task/task-02c-followup-002-sync-forms-responses-test-baseline-001.md` | `pnpm --filter @ubm-hyogo/api test` の pre-existing 4 failures。build exclusion diff 起因ではないが、全体 AC-2 を FULL PASS にできないため追跡が必要。 |
| `task-02c-followup-002-wrangler-dry-run-evidence-001` | `docs/30-workflows/unassigned-task/task-02c-followup-002-wrangler-dry-run-evidence-001.md` | esbuild substitute は bundle 到達性確認として有効だが、Cloudflare wrangler 実 dry-run の証跡は未取得。production deploy readiness evidence として分離。 |

## 未起票判断

- dep-cruiser CI gate は root `lint` に接続済みのため未タスク化しない。
- screenshot evidence は NON_VISUAL かつ UI 変更なしのため不要。
