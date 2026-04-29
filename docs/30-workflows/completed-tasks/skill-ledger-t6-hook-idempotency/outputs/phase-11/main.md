# Phase 11 成果物 — 手動 smoke test (4 worktree 検証)

> **本ワークフローの位置付け**: 本タスク（skill-ledger-t6-hook-idempotency）は **タスク仕様書整備のみ**を目的とする。実 hook 実装・実 smoke 実走・実コミットは別 PR で行う。本 Phase 11 成果物は「実走時に書かれるべきフォーマット定義」と「NOT EXECUTED テンプレ」を確定する。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 状態 | NOT EXECUTED（仕様書整備のみ。実走は別 PR） |
| visualEvidence | NON_VISUAL（スクリーンショット不要。代替 evidence のみ） |
| 代替 evidence | manual-smoke-log.md / manual-test-checklist.md / manual-test-result.md |
| AC 対応 | AC-4（unmerged=0 証跡） / AC-6（wait $PID 個別集約） / AC-7（2 → 4 二段構え） |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |

## 2. 実走前提（gate）

実走（別 PR）に進めるのは次がすべて満たされたときのみ:

1. A-2（Issue #130 / task-skill-ledger-a2-fragment）が completed でマージ済み。
2. A-1（Issue #129 / skill-ledger-a1-gitignore）が completed でマージ済み。
3. 本 PR（仕様書整備）と独立した実装 PR で hook ガード差分が用意されている。
4. ローカルに `mise install` 済み・`pnpm install` 済み・`jq` 利用可能。
5. `git status` がクリーン（`main` HEAD ベースで開始）。

いずれか欠けている場合は NO-GO とし、本フェーズを実走しない。

## 3. 実走範囲

| サブ | 範囲 | 期待結果 | 失敗時の戻し先 |
| --- | --- | --- | --- |
| 11-1 | 2 worktree 事前 smoke | `git ls-files --unmerged | wc -l = 0` | Phase 6 / 9 へ戻し原因分離 |
| 11-2 | 4 worktree full smoke | 同上 + 全 PID rc=0 | サブ 11-1 へ縮約再現 |
| 11-3 | 部分 JSON リカバリの実走 | 破損 JSON 検出 → 削除 → 再 rebuild が決定論的に PASS | Phase 5 ランブックへ戻す |

## 4. NOT EXECUTED テンプレ（実走時に上書きされる項目）

実走者は以下の値を `manual-smoke-log.md` と `manual-test-result.md` に転記する:

```
date_utc:           <YYYY-MM-DDTHH:MM:SSZ>
operator:           <github handle>
host:               <darwin/linux + arch>
node:               <node -v>
pnpm:               <pnpm -v>
mise:               <mise -V>
jq:                 <jq --version>
worktrees:          [verify/t6-1, verify/t6-2, verify/t6-3, verify/t6-4]
pids:               [pid1, pid2, pid3, pid4]
return_codes:       [rc1, rc2, rc3, rc4]
unmerged_count:     0
recovered_jsons:    [<削除した部分 JSON の相対パスリスト、空 OK>]
duration_seconds:   <秒>
result:             PASS | FAIL
```

## 5. 結果サマリ（NOT EXECUTED 時）

- 2 worktree 事前 smoke: **NOT EXECUTED**
- 4 worktree full smoke: **NOT EXECUTED**
- 部分 JSON リカバリ: **NOT EXECUTED**
- `unmerged=0` 証跡: **NOT EXECUTED**

実走 PR 担当はこのセクションを実値で上書きする。

## 6. 関連成果物

| ファイル | 役割 |
| --- | --- |
| outputs/phase-11/manual-smoke-log.md | コマンド系列・PID・rc・unmerged 件数の記入欄 |
| outputs/phase-11/manual-test-checklist.md | 2/4 worktree smoke + 部分 JSON リカバリの実走 checklist |
| outputs/phase-11/manual-test-result.md | 結果テンプレ（PASS / FAIL 判定） |
| outputs/phase-11/link-checklist.md | index.md / artifacts.json / 各 phase / aiworkflow refs リンク確認 |
| outputs/phase-11/discovered-issues.md | 仕様書整備時点で検出された懸念 |
| outputs/phase-11/screenshot-plan.json | NON_VISUAL 判定とスクリーンショット不要の明示 |

## 7. 完了判定

- [ ] 実走 PR 担当が本ファイルを実値で上書きしたか
- [ ] `unmerged_count = 0` を記録したか
- [ ] 失敗 PID と部分 JSON 一覧が `manual-smoke-log.md` に転記されたか
- [ ] `link-checklist.md` のすべての項目が ✓ になったか

実走未完了でも本ワークフロー（仕様書整備 PR）は Phase 11 成果物を NOT EXECUTED 状態でクローズする。
