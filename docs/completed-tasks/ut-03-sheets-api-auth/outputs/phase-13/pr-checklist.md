# Phase 13 PR Checklist

Phase 13 はユーザーの明示承認後のみ実行する。現時点で commit / push / PR 作成は行わない。

## PR 前確認

| 項目 | 状態 |
| --- | --- |
| Phase 1-12 成果物 | completed |
| Phase 12 必須成果物 | completed |
| テスト | `pnpm --filter @ubm-hyogo/integrations test:run -- sheets-auth` を実行予定 |
| typecheck | `pnpm --filter @ubm-hyogo/integrations typecheck` を実行予定 |
| secret hygiene | `.dev.vars` / `**/.dev.vars` が `.gitignore` に含まれる |
| UI screenshot | non_visual のため N/A |
| commit / PR | 未実行 |
