# Phase 10: 最終レビュー（設計書 / DoD 集約）

| Task | DoD（実装着手後の完了条件） |
|------|---------------------------|
| A | sync-status から dry-run/apply が動作し candidates/applied が表示。typecheck/lint/test green。AC-A1..A4 充足 |
| B | sync-status から手動 sync 実行で件数/status 表示、409 競合ハンドル、全件 backfill は confirm 必須。AC-B1..B3 充足 |
| C | /members に最終同期+反映目安、/profile に最終反映+公開状態、03-data-fetching.md に SLA 追記。AC-C1..C4 充足 |
| D | admin sidebar の「フォーム回答」が別タブで Form 編集 URL を開く（target=_blank rel=noopener、定数経由）。AC-D1..D4 充足 |

全体 DoD（AC-G1..G3）: 4 仕様書が CONST_005 を満たし、新規 migration/Form schema 変更なし、1 サイクル完了スコープ。
