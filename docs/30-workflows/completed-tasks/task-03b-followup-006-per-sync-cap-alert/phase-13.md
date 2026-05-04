[実装区分: 実装仕様書]

# Phase 13: commit / PR 承認ゲート — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-12.md

## 成果物

- phase-13.md

## 二重承認ゲート

| ゲート | 承認者 | トリガー |
| --- | --- | --- |
| 実装着手 | user | 「実装して良い」明示指示 |
| commit | user | 「commit して良い」明示指示 |
| push | user | 「push して良い」明示指示 |
| PR 作成 | user | 「PR 作って良い」明示指示 |
| Cloudflare deploy | user | 「production deploy して良い」明示指示 |

## commit 戦略

- 単一 PR / 線形コミット履歴
- `feat(api): per-sync write cap consecutive hit alert (#199)` を主コミットメッセージ
- specs / runbook 追記は別コミットに分離可（`docs: ...`）
- PR base: `main` / head: `feat/issue-199-per-sync-cap-alert`

## PR 本文テンプレ要素

- Summary（3 行以内）
- Issue link: Refs #199
- AC-1〜AC-7 のチェックボックス
- 評価コマンド一覧（Phase 5 Step 10）
- evidence path 一覧（Phase 11）
- ロールバック手順（Phase 9 §4）
- D1 無料枠影響評価（runbook へリンク）

## CI required checks

- typecheck
- lint
- apps/api unit tests
- verify-indexes-up-to-date

## 自動化禁止項目

- `--no-verify` 系 hook bypass
- `git push --force` to main / dev
- `wrangler` 直接呼び出し（必ず `bash scripts/cf.sh`）
- ユーザー明示指示なしのコミット / PR / デプロイ

## DoD（Definition of Done）

- AC-1〜AC-7 すべて green
- typecheck / lint / test / dry-run すべて PASS
- staging で 24 時間 `writeCapHit` 記録が正常
- specs / runbook / unassigned-task / skill-feedback がすべて存在
- production deploy 承認は別途 user 指示
- Issue #199 は close 状態にせず、本タスク完了まで OPEN を維持する。PR 本文・commit は `Refs #199` のみを使い、close は user 明示指示後に限る

## 完了条件

- 上記 DoD すべて満たす
- PR URL が user に通知される
