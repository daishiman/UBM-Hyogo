# Phase 03 — 設計レビュー

## 設計妥当性チェック
| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| SRP | OK | scripts/postmortem は postmortem 生成のみ。Slack 通知・release tag は別タスク |
| pure / 副作用分離 | OK | `validateInput` `renderTemplate` `generatePostmortem` は副作用なし。I/O は `loadTemplate` `ensureEvidencePathExists` `main` に集約 |
| 冪等性 | OK | 非決定要素（時刻・乱数・env）を生成パスから排除 |
| blame-free | OK | template に「誰が」列なし、placeholder に人名なし、grep gate をテストに含める |
| evidence link 必須 | OK | `--evidence` 必須・directory 存在＋`main.md` 必須 |
| 既存 runbook 不侵入 | OK | 既存 `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` を編集しない |

## 苦戦箇所への対処
- S1（blame 禁止）: テストに `responsible|blame|fault|責任|誰が悪い` の grep gate を追加
- S2（evidence 必須）: `validateInput` + `ensureEvidencePathExists` の 2 段階で欠落を弾く
- S3（runbook 責務分離）: 本タスクは `runbooks/postmortem/` のみ追加、既存 incident runbook は読み取り参照のみ
- S4（冪等性）: pure 関数化＋tests で 2 回実行同値を assert
- S5（pnpm 統合）: `scripts.postmortem:generate` を `node --experimental-strip-types` 経由で配線（mise 経由前提を README に明記）

## 残リスク
- `tsx` は現 worktree の esbuild host/binary mismatch で CLI smoke に失敗するため、本CLIは Node 24 `--experimental-strip-types` に固定する。
