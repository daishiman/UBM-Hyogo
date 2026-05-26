# Phase 12: ドキュメント同期

## 12.1 中学生向け概念説明

GitHub Actions の各 workflow には「この workflow が repo に対して何ができるか（読む・書く）」を決める **permissions**（権限）の設定がある。これを書かないと GitHub の既定値に従うため、外側の設定が変わると知らない間に権限が弱くなり、コードを取ってくる最初のステップすら失敗することがある。

各 workflow の冒頭に「最低限これだけは読めます」と書いておけば、外側の設定がどう変わっても土台が崩れず、また token が漏れても被害範囲が最小限になる。今回は 12 件の workflow にこの宣言が無かったので、`contents: read`（=コードを読むだけ）を追加する。書き込みが必要な job だけ、その job の中で個別に上書きする。

## 12.2 lessons-learned 追記候補

### L-WFPERM-001: top-level permissions 不在は構造的脆弱性
default token の権限縮退時に checkout exit 128 を起こす。`ci.yml:15-16` で実証済み。全 workflow で top-level 宣言を必須化する。

### L-WFPERM-002: least-privilege は 2 階層で
top-level に共通最小権限、job-level で必要時のみ write 上書き。両方書く場合は矛盾しない最小値を top に置く。

### L-WFPERM-003: actionlint 1.7.7 を最終ゲートに
local 検証困難時は CI の actionlint step（`ci.yml:52-56`）を最終検証とし、push 前に grep-based 構造レビューで自己検証する。

### L-WFPERM-004: 防御的 hardening は失敗観測を待たずに先回り適用
transient と構造的弱点の切り分けは観測依存で困難なため、無害な防御的 hardening は再現を待たず適用する。

## 12.3 unassigned-task-detection

本実装サイクル完了後、`outputs/phase-12/unassigned-task-detection.md` を作成し以下を確認:
- 既存 top-level permissions 保有 workflow に過剰判定が見つかれば follow-up 起票
- 過剰なしであれば「unassigned tasks: 0 件」として close

CONST_007 に従い本サイクル内で完結させる。先送り前提の分離はしない。

## 12.4 関連ドキュメント更新

- 親タスク `docs/30-workflows/completed-tasks/ci-green-recovery-smoke-coverage-shard/outputs/phase-12/unassigned-task-detection.md` の本 follow-up エントリを「resolved by issue-900-workflow-permissions-least-privilege-audit」へ更新（実装時）。
- CLAUDE.md の workflow 運用節は変更不要（contextual hardening のみ）。
