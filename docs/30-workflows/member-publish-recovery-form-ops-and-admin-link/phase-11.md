# Phase 11: 手動テスト（local static PASS / runtime pending）

実コードは local 実装済み。認証済み admin runtime screenshot は deploy / secret / admin session が必要なため user-gated として残し、local static/focused evidence を一次証跡とする。

| Task | 取得予定 evidence（実装後） |
|------|--------------------------|
| A | sync-status backfill パネル（dry-run 結果 / apply 後） |
| B | sync-status 手動 sync パネル（実行前 / 結果表示 / 409） |
| C | /members 反映目安表示 / /profile 公開状態表示 |
| D | admin sidebar の「フォーム回答」外部リンク表示 / 別タブ遷移 |

VISUAL evidence は実装サイクルで capture する（local component harness or staging）。

| Local evidence | Status |
|---|---|
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| focused Vitest 7 files / 45 tests | PASS |
