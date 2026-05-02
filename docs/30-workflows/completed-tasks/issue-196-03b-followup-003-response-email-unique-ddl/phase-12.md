# Phase 12: ドキュメント更新

[実装区分: 実装仕様書 / NON_VISUAL / implemented-local-static-evidence-pass / d1-migration-list-pending]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 12 |
| status | `implemented-local-static-evidence-pass / strict outputs present` |

## 目的

Phase 12 strict 7 files、aiworkflow-requirements 同期、30種思考法 compact evidence を揃えて仕様 close-out する。

## 実行タスク

- Phase 12 strict 7 files を実体化する。
- quick-reference / resource-map / task-workflow-active / SKILL.md に同期する。
- 実装済み PASS と誤認される表現を避ける。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/automation-30/references/elegant-review-prompt.md`

## 統合テスト連携

Phase 12 は docs evidence の close-out。runtime evidence は Phase 11 の pending container に委譲する。

## 状態境界

本 Phase 12 は `implemented-local-static-evidence-pass` の documentation close-out である。`database-schema.md` と `0001_init.sql` / `0005_response_sync.sql` のコメント同期は worktree に反映済みで、typecheck / lint / SQL semantic diff は取得済みである。production D1 migration list は Phase 13 承認時に取得する。

既適用 migration (`0001_init.sql` / `0005_response_sync.sql`) への変更はコメントのみで、CREATE TABLE / ALTER TABLE / index 定義には触れていない。production D1 migration list は Phase 13 承認時に確認する。

## Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` に Part 1（中学生レベル）+ Part 2（技術者レベル）を作成する。

### Part 1（概念説明・中学生レベル）

- 「データベースの『同じメールアドレスを 2 つ以上登録できない』というルール（UNIQUE）が、本当はどのテーブルについているのか」を一文で説明する
- 例え: 「会員証台帳（`member_identities`）には『同じメアド 1 枚だけ』ルール、提出履歴（`member_responses`）には『同じメアドから何回でも提出 OK』ルール」
- なぜそうなっているのか: 履歴は時系列で増えるので重複してよい / 会員台帳は人を一意に識別したいので重複させない

### Part 2（技術詳細）

- `0001_init.sql:90` の `response_email TEXT NOT NULL UNIQUE` が正本
- `member_responses.response_email` には UNIQUE を付けない設計判断（履歴行性）
- 0005_response_sync.sql の補助コメントとの関係
- spec doc (`database-schema.md`) と DDL コメントの 2 経路同期方針
- 違反した場合に発生する典型的な誤実装（`member_responses(response_email)` への UNIQUE 追加提案）と却下根拠

## Task 12-2: システム仕様書更新

### Step 1-A: 確定した正本仕様の記述

`.claude/skills/aiworkflow-requirements/references/database-schema.md` に以下が反映されること:

- `member_responses` 行末: 「`response_email` 列に UNIQUE 制約は付与しない」明示
- `member_identities` 行末: 「`response_email` は本テーブルにて `NOT NULL UNIQUE`、システム全体の正本 UNIQUE 所在」明示

### Step 1-B: 過去 lessons-learned との同期

`lessons-learned-03b-response-sync-2026-04.md` を読み、`response_email` UNIQUE 所在に関する既存記述があれば本タスク文言と齟齬しないことを確認する。齟齬があれば本タスク Phase 12 で訂正候補としてリストアップ（履歴改ざんではなく追記）。

### Step 1-C: 03b 検出表 #4 の正本訂正

`docs/30-workflows/completed-tasks/03b-.../phase-12/unassigned-task-detection.md` 行 14 の文言:

> `member_responses.response_email` UNIQUE 制約の DDL 上の明文化

を**改ざんしない**。本 workflow Phase 12 main.md に以下のように正本訂正を記録する:

```
### 03b 検出表 #4 の正本訂正

03b workflow Phase 12 unassigned-task-detection.md 行 14 の表記
「member_responses.response_email UNIQUE 制約の DDL 上の明文化」は spec ドリフト由来の誤記である。

正本: response_email の UNIQUE は member_identities.response_email に存在し、
      member_responses 側には存在しない（履歴行性のため意図的）。

参照: apps/api/migrations/0001_init.sql:90
      .claude/skills/aiworkflow-requirements/references/database-schema.md
```

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md`:

- 2026-05-02: response_email UNIQUE 所在の正本化（spec doc / DDL コメント 3 ファイル）

## Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md`（0 件でも出力必須）:

- 検出 0 件、または以下の候補:
  - `lessons-learned-03b-response-sync-2026-04.md` への「UNIQUE 所在変更時は spec/0001/0005 三点同時更新ルール」追記（Phase 8 で言及）
  - GitHub Issue #196 の状態確認: CLOSED のままで良いか、再オープンせず本仕様書 PR で close する旨を PR description に明記する判断

## Task 12-5: skill フィードバックレポート

`outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力必須）:

- task-specification-creator skill: spec ドリフト訂正タスクのテンプレが既存タイプに当てはまるか（spec-drift-correction subtype が新規であれば skill `references/task-type-decision.md` への追記候補）

## Task 12-6: compliance check

`outputs/phase-12/phase12-task-spec-compliance-check.md`:

- strict 7 files の実体確認
- root / outputs `artifacts.json` parity 確認
- Phase 12 が `implemented-local-static-evidence-pass / d1-migration-list-pending` であり、production D1 PASS ではないことの明記
- aiworkflow-requirements quick-reference / resource-map / task-workflow-active / SKILL.md changelog 同期確認
- 30種思考法 compact evidence table の反映確認

## 30種思考法 compact evidence summary

| 分類 | 適用した思考法 | 結論 |
| --- | --- | --- |
| 論理分析系 | 批判的思考 / 演繹思考 / 帰納的思考 / アブダクション / 垂直思考 | UNIQUE 所在の正本は一貫している。既適用 migration への変更はコメントのみで、SQL semantics 不変を Phase 11 evidence で確認する。 |
| 構造分解系 | 要素分解 / MECE / 2軸思考 / プロセス思考 | spec doc / DDL コメント / Phase 12 訂正 / Issue 運用を分離し、必須・条件付き・禁止を明確化する。 |
| メタ・抽象系 | メタ思考 / 抽象化思考 / ダブル・ループ思考 | 真の論点は DDL 編集ではなく「response_email UNIQUE 所在の正本化」。DDL コメントは条件付き手段に落とす。 |
| 発想・拡張系 | ブレインストーミング / 水平思考 / 逆説思考 / 類推思考 / if思考 / 素人思考 | immutable migration 方針なら `database-schema.md` + Phase 12 訂正記録で代替可能。行番号依存は補助扱いにする。 |
| システム系 | システム思考 / 因果関係分析 / 因果ループ | 誤記 -> spec 不在 -> 再調査 -> 誤提案の循環を、aiworkflow 正本導線で遮断する。 |
| 戦略・価値系 | トレードオン思考 / プラスサム思考 / 価値提案思考 / 戦略的思考 | 明文化価値と migration 不変性を両立させるため、spec 正本を最優先し、PR は `Refs #196` に留める。 |
| 問題解決系 | why思考 / 改善思考 / 仮説思考 / 論点思考 / KJ法 | 改善群は「正本化 / migration risk / evidence / issue 運用」。既存仕様破棄は不要。 |

- 本 workflow が Phase 12 必須 5 タスク + compliance を全て計画している
- static evidence 取得済みのため、各 outputs 実体は現在状態で保持

## 完了条件

- [x] Task 12-1 〜 12-6 全ての実体ファイルが `outputs/phase-12/` に配置されている
- [x] 03b 検出表 #4 の正本訂正記録が `outputs/phase-12/main.md` に記録されている
- [x] workflow root を `implemented-local-static-evidence-pass` に同期する

## 成果物

- `outputs/phase-12/main.md` および 6 補助必須ファイル（実体配置済み）
