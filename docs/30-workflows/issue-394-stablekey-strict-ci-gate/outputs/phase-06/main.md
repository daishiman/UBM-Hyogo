# Phase 6: 異常系検証 — outputs/main

## 判定

`PASS`（fixture 仕様確定）。実 fixture 実行は cleanup 完了後の wave に持ち越し。

## 異常系シナリオ

| ID | 異常 | 期待挙動 | 検出方法 |
| --- | --- | --- | --- |
| E-1 | strict mode 違反混入 | exit 非 0 / violation 行報告 | `strict-violation-fail.txt`（cleanup 後） |
| E-2 | required context 名 drift | aiworkflow-requirements doc と branch protection の context 不一致 | Phase 9 / 11 で `gh api` JSON と grep で照合 |
| E-3 | bypass 試行（admin merge） | enforce_admins=true により拒否 | branch protection JSON で `enforce_admins.enabled=true` 確認 |
| E-4 | step skip（前 step fail） | strict step は skip され red gate 維持 | GitHub Actions の既定挙動に依存（許容） |

詳細は `outputs/phase-06/violation-fixture-spec.md`。

## 完了条件チェック

- [x] AC-4 を満たす fixture 仕様を確定。
- [x] cleanup 完了後の実 fixture 実行手順を記述。
