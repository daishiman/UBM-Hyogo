# Phase 4: テスト戦略 — outputs/main

## 判定

`PASS`。テスト matrix を確定し、Phase 11 evidence と紐付け。

## テスト matrix（要約）

| ID | 観点 | 種別 | 期待結果 | 実体化 evidence |
| --- | --- | --- | --- | --- |
| T-1 | 現行 strict が違反検出 | local 実行 | exit 1 / 148 violations | `phase-11/evidence/strict-current-blocker.txt` |
| T-2 | local / CI command 一致 | コマンド比較 | `package.json#scripts.lint:stablekey:strict` と CI step 計画値が完全一致 | `phase-11/evidence/ci-command-trace.md` |
| T-3 | required context 正本確認 | `gh api` | `contexts` に `ci` 含む | `phase-11/evidence/branch-protection-{main,dev}.json` |
| T-4 | cleanup 後 PASS evidence（適用待ち） | local 実行 | exit 0 / 0 violations | `phase-11/evidence/strict-pass.txt`（PLANNED） |
| T-5 | 故意違反 fixture（適用待ち） | local 実行 | exit 1 + 該当ファイル報告 | `phase-11/evidence/strict-violation-fail.txt`（PLANNED） |

詳細表は `outputs/phase-04/test-matrix.md`。

## 完了条件チェック

- [x] AC と矛盾なし。
- [x] T-4 / T-5 は legacy cleanup 完了後に実体化する旨を明示。
