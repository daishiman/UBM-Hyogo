# Phase 6: failure-cases.md

日付: 2026-04-28

## 失敗ケース一覧

| ID | 失敗事象 | 想定原因 | 検出方法 | 対応 |
| --- | --- | --- | --- | --- |
| F-01 | ADR 内 References のリンク切れ | 相対パス計算ミス | `python3 -c 'import os; ...'` でパス検算 + `test -f` | 相対パスを再計算して修正 |
| F-02 | 必須セクション欠落（例: Alternatives Considered なし） | 執筆時の見落とし | `grep -E '^## '` で見出し列挙 | 欠落セクションを追加 |
| F-03 | Alternatives Considered のサブ節不足（3 候補揃わず） | husky / pre-commit / native のいずれか抜け | `grep -E '^### [ABC]\.'` | 不足候補の節を追加 |
| F-04 | backlink が派生元の元記述を書き換える | Edit ツールでの old_string 取り違え | git diff で元記述の保存を確認 | 元記述に戻し、追記のみで再適用 |
| F-05 | backlink の相対パスが解決しない | `../` の数を間違えた | T-08 のチェックスクリプト | 6 階層（`../../../../../../`）に修正 |
| F-06 | ADR ファイル名が命名規約 `NNNN-<slug>.md` に違反 | typo / 大文字小文字 | `ls doc/decisions/` で確認 | リネーム |
| F-07 | ADR Decision の lane 名が `lefthook.yml` と不一致 | コピーミス | `grep` で両ファイルの lane 名比較 | ADR 側を `lefthook.yml` に合わせる |
| F-08 | ADR Consequences が `lefthook-operations.md` と矛盾（例: post-merge 復活と書く） | 派生元の解釈ミス | 目視レビュー | ADR 側を運用ドキュメントに合わせる |

## 緊急時のロールバック

- `doc/decisions/` 配下を削除
- 派生元 outputs から backlink 行を Edit で除去（git restore は使わず、追記行のみピンポイントで削除）
