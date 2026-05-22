# Phase 12: 正本同期 (中学生レベル概念説明 + 7 必須 output)

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| 前 Phase | 11 (VISUAL evidence + runtime) |
| 次 Phase | 13 (PR・振り返り) |
| 状態 | spec_created |

## 中学生レベル概念説明

### このタスクが解決する問題はなに？

管理画面のなかに「Google Form のあたらしい質問が来たら、それをデータベースの正式な名前（stableKey）にひもづけて登録する」という機能があります。これを「resolve（解決）」とよびます。

ところが、resolve はいちど押すと**取り消せません**でした。管理者がうっかり間違った名前にひもづけてしまっても、UI からは戻せず、エンジニアがデータベースに直接 SQL を打って修正する、という運用になっていました。

これは 2 つの理由で良くありません:

1. データベースに直接 SQL を打つのは事故のもと（となりの行も壊してしまう）
2. 「いつ誰が何を取り消したか」が記録に残らない（監査ができない）

### このタスクで実際にやること

3 つあります:

1. **取り消しボタンをつくる**: 管理画面に「rollback（取り消し）」ボタンを追加して、誤った resolve を取り消せるようにします
2. **5 分以内なら即「取消」できる**: resolve した直後に「あ、間違えた」と気づいたとき用に、5 分間だけ画面の下に「取消」リンクが出るようにします（これを undo とよびます）
3. **取り消しも監査ログに記録する**: 取り消し操作そのものも `audit_log` に記録して、「いつ誰がどれを取り消したか」がきちんと追えるようにします

### データベースに「消した印」をつける

取り消すといっても、データを完全に消すと履歴がわからなくなります。なので「消した印（`deleted_at` という列）」をつけるだけにします。これを **soft delete（ソフト削除）** とよびます。あとで「いつ消えたか」を見たいときに役立ちます。

### 同時に 2 人の管理者が操作したらどうなる？

A さんが取り消そうとしているあいだに、B さんも同じものを別の名前で resolve しなおす、ということが起こると混乱します。これを防ぐために `version`（バージョン番号）という列をつけて、「自分が見たときの version と一致するときだけ取り消し OK」というルールにします。これを **楽観ロック** とよびます。

### なぜ Issue は CLOSED のまま？

GitHub の Issue #778 は 2026 年 5 月 19 日にクローズされていますが、コードを調べてみると**取り消し機能はまだ作られていません**でした。リンクされた PR もコメントもなかったので、「とりあえずクローズした」だけと思われます。

ただ、Issue を再オープンすると workflow 管理がぐちゃぐちゃになるので、**クローズのまま**コードベース側のドキュメント（unassigned-task）に「Issue #778 の仕様書として消化済み」というしるしを残します。

### このタスクで何が変わる？

- 管理者が誤 resolve を**自分で取り消せる**ようになる
- データベースに直接 SQL を打つ運用がなくなる
- 「いつ誰が何を取り消したか」が監査ログに残る
- soft delete なので「いつ取り消したか」も完全に追跡できる

### このタスクで何が変わらない？

- resolve そのものの動き
- 既存の `POST /admin/schema/aliases` の振る舞い
- D1 の他のテーブル

### あえて今やらないこと（次の followup へまわすもの）

- 別画面で詳細な履歴を見る機能（followup-003 history view）
- 取り消したあとに集計を自動で計算しなおす機能（followup-005）
- 一度に複数の alias を取り消す bulk 機能（followup-006）
- 取り消されたら Slack 通知する機能（followup-007）

これらを今サイクルに入れると、本タスク（取り消しの基本機能）が完成しないリスクがあるので、別 followup として分けます。

## 7 必須 output（task-specification-creator skill 規定）

各 output は `outputs/phase-12/` 配下に配置する。

### main.md

タスク全体の summary。本 phase-12.md の中学生レベル概念説明 + AC 達成状況の要約。

### implementation-guide.md

後続実行者向け実装指示書。Phase 06 の Step 1-9 を 1 ファイルに集約。Phase 13 `diff-to-pr` の参照源。

### system-spec-update-summary.md

正本仕様の差分要約:
- `docs/00-getting-started-manual/specs/11-admin-management.md` に rollback / undo 操作仕様追記
- `docs/00-getting-started-manual/specs/01-api-schema.md` に rollback endpoint 追記

### documentation-changelog.md

本サイクル発生ドキュメント差分:
- `docs/30-workflows/issue-778-schema-alias-rollback-undo/` 全 phase + outputs
- 既存 `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md` 参照 + `serial-05-step-03-followup-{005,006,007}-*.md` 3 件新規追加
- `docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md` fold-state sync
- `docs/00-getting-started-manual/specs/{11-admin-management,01-api-schema}.md` 追記

### unassigned-task-detection.md

本タスク完了後に新規発生 / 持ち越し未割当タスク:
- **followup-003**: 既存 schema diff history view（独立 UI screen）— 本タスク CONST_007 例外で分離し、重複ファイルは作らない
- **followup-005**: rollback 後 recompute trigger — 集計バッチ仕様未確定のため分離
- **followup-006**: bulk rollback — race condition 設計負荷増のため分離
- **followup-007**: rollback notification — 通知チャネル仕様未確定のため分離
- **fold-state sync**: 原典 `serial-05-step-03-followup-004-schema-alias-rollback-undo.md` に `consumed_via_issue_778_rollback_undo_spec` 同期記録

### skill-feedback-report.md

skill 改善フィードバック:
- task-specification-creator: 「CONST_007 例外宣言」を index.md に必須セクション化するパターン
- aiworkflow-requirements: D1 soft delete + 楽観ロック (`version` 列) のパターンを正本に追加候補

### phase12-task-spec-compliance-check.md

strict compliance check:

| check | 結果 |
| --- | --- |
| 全 phase ファイル存在（01-13） | PASS |
| 実装区分明記 | PASS |
| CONST_005 必須 6 項目 | PASS（Phase 05/06） |
| CONST_007 例外宣言 | PASS（index.md / Phase 04） |
| Phase 12 中学生レベル概念説明 | PASS |
| 7 必須 output 揃い | PASS |
| fold-state sync 計画 | PASS |

## 完了条件

- [x] 中学生レベル概念説明明記
- [x] 7 必須 output 計画明記
- [x] 7 ファイルの outputs 物理配置

## 次 Phase

- 次: 13（PR・振り返り）
