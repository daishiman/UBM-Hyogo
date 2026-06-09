# Skill フィードバックレポート — cf-token-env-contract-and-rotation-retirement

本ファイルは改善点なしでも出力必須。観点 = テンプレート改善 / ワークフロー改善 / ドキュメント改善。

## テンプレート改善

| 観点 | 内容 | 採否 |
| ---- | ---- | ---- |
| CI 失敗ログ起点 spec のテンプレート化 | `related_issue=null`（CI 失敗ログ起点）の spec で、**「provisioning 正本」と「CI workflow が消費する secret」の突合を要件化する観点**が有用だった。issue 起点 spec のテンプレには「真因 = コード bug」前提が暗黙にあるが、CI 赤の真因が**構造ギャップ（投入正本の漏れ）**であるケースを Phase 1 要件定義のチェック項目に追加すると再現性が上がる | **反映済**: `.claude/skills/task-specification-creator/references/phase-template-phase1.md` に CI secret / env provisioning gap gate を追加 |
| 「ユーザー仮説の事実誤認」を明示するフィールド | 本タスクではユーザー仮説「週次トークン失効」が事実誤認で、真因が provision 欠落だった。`issue_optimization_note` に仮説と真因の差分を記録した運用は、後続の同型誤認を防ぐのに有効 | **採用済**（artifacts.json `issue_optimization_note`） |

## ワークフロー改善

| 観点 | 内容 | 採否 |
| ---- | ---- | ---- |
| graceful degrade パターンの再利用 | 既存 `RUNTIME_SMOKE_MINT_DEGRADED` を踏襲して `verify-bulk-inputs.outputs.cf_degraded` を命名・配線したことで、**命名一貫性と直交フラグ設計**が自然に決まった。「新規 degrade フラグは既存 degrade パターンを踏襲する」ルールは再利用価値が高い | **採用済**（phase-2 設計・既存パターン踏襲を再利用候補表に明記） |
| drift gate 雛形の再利用 | `verify-mint-env-contract.{mts,yml}` を雛形にしつつ**責務が異なるため別ファイル**で実装する判断（既存 verifier 無改変・AC-7）は、gate 量産時の「雛形流用 vs 責務分離」の良い基準。skill の reference に「契約 gate は責務単位で別ファイル化する」原則を残すと有用 | **反映済**: `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` に contract gate responsibility split を追加 |
| paths フィルタ footgun の事前注記 | required status check 化を見据えた `pull_request.paths` footgun（非該当 PR で永久 pending）を spec 段階で注記した運用は、後続の branch protection 登録時の事故を防ぐ。memory issue-1146 教訓の横展開が機能した | **採用済**（phase-2 / implementation-guide / phase-11 baseline B-1） |

## ドキュメント改善

| 観点 | 内容 | 採否 |
| ---- | ---- | ---- |
| 運用 runbook の「不採用判断記録」章 | B2 runbook に「90 日カレンダーローテ撤廃理由 / OIDC 不採用理由」を不採用判断記録として残す構成は、後続が同じ検討を蒸し返すのを防ぐ。運用 doc テンプレに「不採用判断記録」章を標準化すると価値がある | **反映済**: `.claude/skills/task-specification-creator/references/technical-documentation-guide.md` に runbook retired marker / replacement policy / rejected reason を追加 |
| tombstone + log の二段保持 | 旧 runbook を削除せず RETIRED 注記（B3 tombstone）+ log 追記（B4）で監査履歴を保持する運用は、ポリシー変更の追跡性に有効。「ポリシー撤廃時は削除せず tombstone + log」を原則化できる | **採用済**（phase-2 B3/B4 設計） |

## 総括

- 本タスク固有の阻害要因・skill テンプレの欠陥は検出されなかった。既存パターン（degrade フラグ・契約 gate 雛形・paths footgun 注記・tombstone）の再利用が良く機能した。
- skill feedback 3 件は本 wave で task-specification-creator reference / changelog へ反映済み。SKILL.md 本体への frontmatter trigger 追加は不要（既存 trigger で CI / Cloudflare / workflow が発火するため）。
