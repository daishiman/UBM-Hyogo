# Phase 6: テスト拡張（設計書）

各タスク spec の主要テストケースを focused Vitest として追加し、境界・異常系を local で検証した。

- A: backfill apply の skipped 内訳（alreadyPublic/adminExplicit/consentNotMet/deleted）表示の境界。
- B: 409 `sync_in_progress` の再試行 UX、全件 backfill の破壊的確認ダイアログ。
- C: lastSyncAt = null（未同期）時の fail-soft 表示、最悪ケース（hourly sync 待ち）の文言。
- D: 外部 icon の a11y（`aria-label` で外部遷移を明示）。
