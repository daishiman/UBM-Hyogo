# Phase 9 — レビュー観点

| # | 観点 | チェック |
|---|---|---|
| R1 | 章タイトルが `lefthook.yml` `fail_text` から想起しやすいか | 「skill indexes drift gate」「pnpm indexes:rebuild」が含まれる |
| R2 | trigger 条件が workflow ファイルと一致しているか | push:main / pr:main,dev / context: verify-indexes-up-to-date |
| R3 | 復旧コマンドが `mise exec --` プレフィックス付きで CLAUDE.md と整合しているか | YES |
| R4 | A (pre-push 拒否時) と B (CI 失敗時) の順序が現実の頻度に合っているか | A を主、B を例外として記述 |
| R5 | 「手編集禁止」「--no-verify 禁止」が明示されているか | 厳守事項節に記載 |
| R6 | 関連リンク節への追記が不要か（既存セクション内で完結） | 不要（同ファイル内章リンクで十分） |
| R7 | 文体が既存ガイドと整合しているか | post-merge 自動再生成廃止と同形式 |
