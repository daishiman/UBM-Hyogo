# Phase 11: runtime evidence 取得

## 目的

PUT 前後の protection スナップショット、PR pending 動作確認 evidence、最終 diff サマリーを `outputs/phase-11/` 配下に揃える。

## 必須 evidence ファイル

| ファイル | 種類 | 取得元 |
| --- | --- | --- |
| `outputs/phase-11/before-dev-protection.json` | JSON | Phase 5 §1 |
| `outputs/phase-11/before-main-protection.json` | JSON | Phase 6 §1 |
| `outputs/phase-11/after-dev-protection.json` | JSON | Phase 5 §4 |
| `outputs/phase-11/after-main-protection.json` | JSON | Phase 6 §4 |
| `outputs/phase-11/dev-diff.txt` | text | Phase 4 §4.1 |
| `outputs/phase-11/main-diff.txt` | text | Phase 4 §4.1（main 版） |
| `outputs/phase-11/diff-summary.md` | markdown | 本 Phase で集約 |
| `outputs/phase-11/pr-pending-check.txt` | text（任意） | §11.3 で取得した場合 |

## 11.1 diff-summary.md の形式

```markdown
# diff-summary

## dev
- before contexts: [<list>]
- after  contexts: [<list>]
- 追加: audit-correlation-verify / verify
- 不変条件 grep: PASS（Phase 10）

## main
- before contexts: [<list>]
- after  contexts: [<list>]
- 追加: audit-correlation-verify / verify
- 不変条件 grep: PASS（Phase 10）

## 実施日時
- dev PUT: <ISO8601>
- main PUT: <ISO8601>
```

## 11.2 NON_VISUAL evidence

このタスクは `visualEvidence: NON_VISUAL`。スクリーンショットは取得しない。代わりに JSON スナップショット 4 件 + diff text + summary が evidence の正本。

## 11.3 PR pending check（任意）

dev に向けた docs-only PR を 1 件作成し、`gh pr checks <PR>` の出力に `audit-correlation-verify / verify` が `Required` として現れることを 1 度確認する。確認できたら出力を `pr-pending-check.txt` に保存。検証目的の PR はそのまま close または merge してよい。

## DoD（Phase 11）

- [ ] 必須 evidence ファイル 7 件（任意 1 件除く）がすべて存在
- [ ] `diff-summary.md` が dev / main 双方の差分・実施日時を含む
- [ ] Phase 10 の不変条件 grep ログが reference されている
