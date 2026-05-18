# Phase 8 — Before / After

## Before

`lefthook-operations.md` の構成:

1. 構成ファイル
2. 初回セットアップ
3. 日常コマンド
4. **post-merge 自動再生成廃止について** ← ここに verify-indexes-up-to-date の存在のみ言及
5. sync-merge 時の hook 自動スキップ
6. トラブルシューティング
7. 関連リンク

**問題**: trigger 条件 (push/pr target branches)、status context 名、復旧 SOP が散在 / 未文書化。

## After

`lefthook-operations.md` の構成:

1. 構成ファイル
2. 初回セットアップ
3. 日常コマンド
4. post-merge 自動再生成廃止について
5. **【NEW】skill indexes drift gate — trigger 条件と復旧 SOP**
   - CI gate: verify-indexes-up-to-date (表)
   - 一次防衛: pre-push hook (表)
   - 復旧 SOP A (pre-push 拒否時)
   - 復旧 SOP B (CI 失敗時・例外)
   - 厳守事項
6. sync-merge 時の hook 自動スキップ
7. トラブルシューティング
8. 関連リンク

**改善**: 単一セクションで trigger / 防衛層 / SOP / 厳守事項を網羅。grep 性も確保。
