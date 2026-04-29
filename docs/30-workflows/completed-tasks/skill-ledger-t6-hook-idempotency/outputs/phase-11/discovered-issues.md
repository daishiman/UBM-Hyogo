# discovered-issues — 仕様書整備時点で検出された懸念

> 本ワークフローはタスク仕様書整備のみ。実走時に追加で検出された事象は実走 PR で本ファイルへ追記する。

## 1. 仕様書整備時点で確認済みの懸念事項

| # | 懸念 | 影響 | 対応 / 緩和 |
| --- | --- | --- | --- |
| D-1 | A-2（Issue #130） / A-1（Issue #129）が completed でない状態で T-6 実装に着手すると、`LOGS.md` 履歴が gitignore 連鎖で意図せず ignore されうる | 実装に着手しても安全な工程順序が崩れる | Phase 1 / 2 / 3 の 3 箇所で gate を重複明記（AC-5）。Phase 11 実走前にも Issue #130 / #129 の状態を再確認する |
| D-2 | Mac mini 等の I/O 帯域では 4 並列 `pnpm indexes:rebuild` が飽和し、部分 JSON 残留率が上がる可能性 | 4 worktree smoke が誤って FAIL 判定され、原因分離が遠回りになる | 2 worktree 事前 smoke を gate にし PASS 後のみ 4 worktree へ拡張（AC-7）。さらに lane 2 の部分 JSON リカバリを必須化 |
| D-3 | `wait` を引数なしで呼ぶと最後のジョブ rc しか取れず、失敗 PID を見逃す | AC-6 違反 / 失敗の見落とし | smoke 系列を `pids+=("$!")` + `for pid in "${pids[@]}"; do wait "$pid" || rc=$?; done` で固定 |
| D-4 | hook ガード未追加で `git rm --cached` 後に hook が自動 `git add` する循環 | A-1 untrack が即座に無効化される | AC-1 で hook の `git add` 系コマンドを全面禁止（仕様レベル） |
| D-5 | `pnpm indexes:rebuild` の途中失敗で破損 JSON が残ると、後続の `jq` 系処理が決定論的に壊れる | 後続フェーズが連鎖失敗 | AC-3 として `jq -e . <file> || rm <file>` → 再 rebuild のリカバリループを Phase 2 に固定 |
| D-6 | `lefthook.yml` の手書き直編集や `.git/hooks/*` の直接編集が再発する | hook 運用正本が壊れる | CLAUDE.md の方針通り `pnpm install` の `prepare` 経由で `lefthook install` のみに限定。本 PR では編集しない |
| D-7 | hook 編集と smoke 実走を 1 PR にまとめると差分が肥大化し、Phase 11 のロールバック単位が崩れる | revert 1 コミット粒度（AC-8）が崩れる | 仕様書整備 PR と実 hook 実装 PR を分離。本ワークフローは仕様書整備のみで完結する |
| D-8 | NON_VISUAL タスクのため screenshot 系 evidence が無く、レビューで検証可能性が下がりがち | レビュー疲弊 | manual-smoke-log.md / manual-test-result.md を一次 evidence とし、`screenshot-plan.json` でスクリーンショット不要を明示する |
| D-9 | Issue #161 を CLOSED のまま参照する運用がツール側で reopen 提案を出す可能性 | 運用ノイズ | artifacts.json の `metadata.issue_state_note` で CLOSED 維持を明文化。reopen は実装 PR 側でも行わない |

## 2. 実走時に追記すべき項目（テンプレ）

| 項目 | 値 |
| --- | --- |
| 検出日 | NOT EXECUTED |
| 事象 | NOT EXECUTED |
| 影響範囲 | NOT EXECUTED |
| 一次切り分け | NOT EXECUTED |
| 戻し先 Phase | NOT EXECUTED |
| 関連 Issue | NOT EXECUTED |

## 3. 完了条件

- 仕様書整備 PR では D-1〜D-9 を反映済みとし、本ファイルが Phase 11 の懸念集約点であることを Phase 12 から参照できる状態にする。
- 実走 PR では §2 のテンプレを必要件数だけ追加する。
