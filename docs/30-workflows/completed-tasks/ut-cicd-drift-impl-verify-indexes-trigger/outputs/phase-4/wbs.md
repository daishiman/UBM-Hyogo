# Phase 4 — WBS

| # | タスク | 成果物 | 依存 |
|---|---|---|---|
| W1 | `lefthook-operations.md` を Read | 現状把握 | - |
| W2 | 新セクション本文を作成（Phase 6 draft.md ベース） | 追記テキスト | W1 |
| W3 | Edit tool で「## post-merge 自動再生成廃止について」セクション直後に挿入 | 修正 .md | W2 |
| W4 | `lefthook.yml` `fail_text` の章タイトル参照整合チェック | 整合判定 | W3 |
| W5 | リンク・パス参照の正当性検証（rg / ls） | 検証結果 | W3 |
| W6 | AC-1〜AC-5 を Phase 10 手順に従い検証 | チェック結果 | W3 |

主作業は `lefthook-operations.md` への追記で完了する。AC-5 の導線確保として `lefthook.yml` fail_text に runbook 詳細リンクを 1 行追加する。
