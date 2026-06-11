# Phase 9: 品質保証

## 9.1 docs-only QA の対象

本タスクの QA は実行時挙動ではなく**ドキュメント品質**を対象とする。観点は以下 4 つ:

1. markdown 整形（テーブル列数・見出し階層・コードフェンスの破綻なし）
2. リンク有効性（残るリンクが現存パスを指す）
3. dangling 参照 0（削除済み workflow / tombstone runbook への参照が本文・ミラー双方に無い）
4. ミラーと #524 本文の本文部分 parity（片側 drift なし）

## 9.2 QA チェック項目

| # | 項目 | 確認方法 | 期待 |
|---|------|----------|------|
| QA-1 | dangling 参照 0（reminder yml・本文） | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-reminder.yml"` | `0` |
| QA-2 | dangling 参照 0（runbook md・本文） | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-runbook.md"` | `0` |
| QA-3 | dangling 参照 0（ミラー双方） | `grep -cE "cf-token-rotation-reminder.yml\|cf-token-rotation-runbook.md" docs/30-workflows/issues/issue-524.md` | `0` |
| QA-4 | #407 行が無い（本文） | `gh issue view 524 --json body -q .body \| grep -c "Issue #407"` | `0` |
| QA-5 | #407 行が無い（ミラー） | `grep -c "Issue #407" docs/30-workflows/issues/issue-524.md` | `0` |
| QA-6 | 残り 2 件（#351）が保全されている | `gh issue view 524 --json body -q .body \| grep -c "Issue #351"` | `1` 以上 |
| QA-7 | 残り 2 件（#484）が保全されている | `gh issue view 524 --json body -q .body \| grep -c "Issue #484"` | `1` 以上 |
| QA-8 | 通知先セクションが保全されている | `gh issue view 524 --json body -q .body \| grep -c "ubm-hyogo-ops"` | `1` 以上 |
| QA-9 | 撤廃注記が存在する | `gh issue view 524 --json body -q .body \| grep -c "2026-06-08 更新"` | `1` |
| QA-10 | スコープ件数が 2 件へ整合 | `gh issue view 524 --json body -q .body \| grep -c "2 ワークフロー"` | `1` 以上 |
| QA-11 | ミラーと本文の本文 parity | `diff <(gh issue view 524 --json body -q .body) <(本文抽出: ミラーのメタ YAML を除いた本文)` | 本文部分が一致 |
| QA-12 | 残るリンクが現存パス（dashboard yml） | `test -f .github/workflows/post-release-dashboard.yml` | exit 0 |
| QA-13 | 残るリンクが現存パス（analytics export yml） | `test -f .github/workflows/cloudflare-analytics-export.yml` | exit 0 |
| QA-14 | 撤廃経緯リンクが現存 dir | `test -d docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement` | exit 0 |
| QA-15 | ミラー md の markdown 整形（テーブル列数破綻なし） | 目視 / markdownlint 相当 | 通知統合テーブルが 2 行・4 列で整合 |

> QA-11 の本文 parity は「メタ情報ブロック（ミラー冒頭の YAML）を除いた本文部分」を比較する。メタ情報は構造上ミラー固有のため parity 対象外。

## 9.3 保全（落としてはいけないもの）チェック

| 保全対象 | 落とすと起きる障害 | 担保する QA |
|----------|--------------------|-------------|
| #351 / #484 のテーブル行・スコープ | 残スコープ消失・#524 本体が空洞化 | QA-6 / QA-7 |
| 通知先セクション（Workspace / Channel） | 残 2 件の投稿先が不明になる | QA-8 |
| secret hygiene（redaction 方針）行 | 過剰削除（Phase 3.5 残置判定違反） | 残置確認（grep で zone/account redaction 行が残る） |

## 完了条件（Phase 9）

- [x] docs-only QA の 4 観点（整形 / リンク / dangling / parity）を定義した。
- [x] QA チェック項目（QA-1〜QA-15）をテーブル化した。
- [x] dangling 0・残 2 件保全・通知先保全・本文 parity を検証項目に含めた。
- [x] 保全対象と障害・担保 QA の対応を記録した。
