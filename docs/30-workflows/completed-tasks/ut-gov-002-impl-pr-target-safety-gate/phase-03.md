# Phase 03: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 3 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

Phase 2 で固定した実装設計（`outputs/phase-2/design.md`）を、複数代替案の比較と PASS/MINOR/MAJOR レビューで妥当性検証し、`outputs/phase-3/review.md` に記録する。実 workflow 編集タスクとして「pwn request 非該当」「required status checks 名 drift ゼロ」「単一 revert ロールバック可能」の 3 軸を expert review で署名できる状態にする。

## 実行タスク

- 代替案を `outputs/phase-3/review.md` に列挙し、PASS/MINOR/MAJOR で評価する：
  - **A** `pull_request_target` を残しつつ PR head を checkout（**MAJOR**：pwn request の典型、却下）。
  - **B** `pull_request_target` を完全廃止（**MINOR**：fork PR の triage（label / auto-merge）が GITHUB_TOKEN を必要とするケースで運用負荷増、却下）。
  - **C** `pull_request_target` を triage 専用、build/test を `pull_request` に分離（**PASS**、本実装の base case として採択）。
  - **D** C + `workflow_run` 経由で secrets を fork build に橋渡し（**MAJOR**：橋渡しが新たな pwn surface、却下）。
- 上流 dry-run 仕様の review.md と整合性を取り、本 IMPL タスク特有の評価軸（実 workflow 差分 / 4 系統 dry-run 実走 / VISUAL evidence）を追加する。
- "pwn request" 非該当 5 箇条の検証手順を表化する（行: 5 箇条、列: 「現状」「Phase 5 適用後」「Phase 9 静的検査コマンド」「Phase 11 dry-run 目視確認手段」）。
- NO-GO 条件を 4 つ記述する：
  - **N-1** 上流 dry-run 仕様（UT-GOV-002）が完成していない、または design.md / runbook が input として参照不能。
  - **N-2** UT-GOV-001 未適用で dev / main の branch protection が未設定、required status checks 名同期が検証不能。
  - **N-3** UT-GOV-007 未適用で `uses:` が SHA pin されていない（外部 action からの pwn surface が残存）。
  - **N-4** required status checks の job 名 drift が `gh api repos/:owner/:repo/branches/main/protection` 実行で検知済みのまま放置されている。
- security 観点の expert review 観点を列挙する：
  - **S-1** secrets 棚卸し（triage workflow が触る secret の allowlist）。
  - **S-2** GITHUB_TOKEN scope の最小化（job 単位の `permissions:` 設計レビュー）。
  - **S-3** `actions: write` / `contents: write` 権限の有無監査。
  - **S-4** 外部 Marketplace action の SHA pin 確認（UT-GOV-007 連携）。
  - **S-5** triage workflow が参照する label / branch / file の allowlist 確認。
  - **S-6** fork PR からの label injection 経路（`labeled` trigger 悪用）の検証観点。
- ロールバック設計のレビュー：単一 `git revert` で safety gate 導入前へ戻せること、required status checks 名 drift 発生時の復旧手順が runbook 側で参照可能であることを確認する。
- 用語整合チェック：Phase 1 で固定した canonical（`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern`）が design.md / review.md / 上流 dry-run 仕様と表記揺れなく一致しているかを確認し、結果を review.md に記録。
- レビュー記録の保存先を `outputs/phase-3/review.md` に固定し、`outputs/phase-3/main.md` から相互参照する。

## 参照資料

- `outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-3/review.md`
- `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`
- `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md`
- `https://securitylab.github.com/research/github-actions-preventing-pwn-requests/`
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物

- `outputs/phase-3/main.md`
- `outputs/phase-3/review.md`

## 統合テスト連携

review.md に Phase 9（品質保証）で再検証する観点（"pwn request" 非該当 5 箇条 / required status checks 名同期 / `actionlint` 結果）の入口を記述する。Phase 11（手動テスト）で 4 系統 dry-run の VISUAL evidence と突合する観点も併記する。

## 完了条件

- [ ] 代替案 A〜D が PASS/MINOR/MAJOR で評価され、C 案が PASS で採択されている。
- [ ] "pwn request" 非該当 5 箇条の検証手順が 4 列の表で記述されている。
- [ ] NO-GO 条件 N-1〜N-4 が記述されている（dry-run 仕様未完成 / UT-GOV-001 未適用 / UT-GOV-007 未適用 / required status checks 名 drift）。
- [ ] security expert review 観点 S-1〜S-6 が列挙されている。
- [ ] ロールバック設計レビュー結果が記述されている。
- [ ] 用語整合チェック結果が記録されている。
- [ ] レビュー記録が `outputs/phase-3/review.md` に保存されている。
- [ ] artifacts.json の Phase 3 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
