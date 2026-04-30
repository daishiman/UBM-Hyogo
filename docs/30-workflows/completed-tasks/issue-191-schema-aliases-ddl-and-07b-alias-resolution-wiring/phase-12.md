# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11（手動 smoke） |
| 次 Phase | 13（PR 作成） |
| 状態 | spec_created |
| workflow_state | spec_created（`completed` に書き換え禁止） |

## 目的

CLOSED issue #191 に対する補完仕様化として、Phase 12 必須成果物 7 点のファイル名、責務、章構成を確定する。実装完了を示す本文ではなく、docs-only / spec_created として後続実装 issue が参照できる正本更新計画、未タスク検出、skill feedback、準拠チェックを残す。

## 5 タスク（必須・全て出力）

### 12-1. implementation-guide.md

- ファイル: `outputs/phase-12/implementation-guide.md`
- 章構成案:
  - **Part 1: 中学生レベル概念説明**
    - 1.1 「あだ名表（alias）」って何？（人にもニックネームがあるのと同じで、フォームの質問にもニックネームを付ける表）
    - 1.2 なぜ別の表にする？（質問本体を書き換えると、Google Form を更新する人と admin 操作する人がぶつかるから、別ノートに書く）
    - 1.3 どう使う？（07b 画面で「この質問のあだ名は membership_kind ね」と決めると、03a が次回読みに行ったときに迷わなくなる）
  - **Part 2: 技術者レベル**
    - 2.1 DDL（CREATE TABLE schema_aliases / 主要カラム / index 設計）
    - 2.2 `schemaAliasesRepository` 契約（lookup / insert / update のシグネチャ）
    - 2.3 07b 配線変更（書き込み先を schema_questions → schema_aliases へ切替）
    - 2.4 03a 互換 path（alias を先に lookup → fallback で schema_questions.stable_key）
    - 2.5 移行戦略（fallback 廃止までのロードマップ / lint rule 段階導入）

### 12-2. system-spec-update-summary.md

- ファイル: `outputs/phase-12/system-spec-update-summary.md`
- 対象: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` への schema_aliases テーブル定義追記
- 章構成案:
  - **Step 1-A**: workflow 記録、LOGS、`indexes/resource-map.md` / `indexes/quick-reference.md` への登録要否
  - **Step 1-B**: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` への `schema_aliases` テーブル定義と repository 契約追記計画
  - **Step 1-C**: 関連タスク（03a / 07b / 02b）と `task-workflow-active.md` の更新要否
  - **Step 1-D**: `runbook-diff-plan` と fallback 廃止 follow-up の要否
  - **Step 2 再判定**: 新規 D1 テーブル / repository 契約追加のため `database-implementation-core.md` 更新は必要。API endpoint 正本は既存 07b との差分確認後に更新要否を判定
- skill index drift 対策: 追記後 `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行する旨を明記

### 12-3. documentation-changelog.md

- ファイル: `outputs/phase-12/documentation-changelog.md`
- 章構成案:
  - 3.1 本タスクで新規作成したファイル一覧（index.md / artifacts.json / phase-01〜13.md / outputs/phase-12/* completed evidence）
  - 3.2 既存 docs への影響有無（`completed-tasks/03a-...` `completed-tasks/07b-...` は read-only 参照のみで改変なし）
  - 3.3 将来の更新トリガー（実装タスク起票時 / fallback 廃止時 / lint rule 昇格時）

### 12-4. unassigned-task-detection.md

- ファイル: `outputs/phase-12/unassigned-task-detection.md`
- 0 件でも出力必須
- 章構成案:
  - 4.1 検出方針（本タスクは spec_created のため、実装範囲外を unassigned として明示）
  - 4.2 unassigned 候補（別 issue 化提案）
    - **候補 A**: schema_aliases 実装タスク本体（DDL apply / repository 実装 / 07b 配線 / 03a fallback path 実装）
    - **候補 B**: 移行期間終了後の `schema_questions.stable_key` fallback 廃止タスク（運用統計を見て判断）
    - **候補 C**: `UPDATE schema_questions SET stable_key` の lint rule CI 化タスク（grep ベース → AST ベース昇格）
  - 4.3 別 issue 起票テンプレ（title / labels / depends_on のドラフト）

### 12-5. skill-feedback-report.md

- ファイル: `outputs/phase-12/skill-feedback-report.md`
- 改善点なしでも出力必須
- 章構成案:
  - 5.1 task-specification-creator skill への学び
    - CLOSED issue に対する spec_created 運用パターン（再 OPEN せず補完仕様として残す）
    - 「実装と仕様書を切り離す」運用が docs_only=true / visualEvidence=NON_VISUAL の組み合わせで成立する事例
  - 5.2 aiworkflow-requirements skill への学び
    - schema 系テーブル追加時の references/database-implementation-core.md 改訂手順の標準化
    - skill index drift 検知（CI gate）と本タスクの整合
  - 5.3 改善提案有無（無しの場合も「無し」と明示）

### 12-6. phase12-task-spec-compliance-check.md

- ファイル: `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 章構成案:
  - task-specification-creator 必須見出しチェック
  - aiworkflow-requirements 正本更新対象チェック
  - `artifacts.json` / `outputs/artifacts.json` parity
  - docs-only / NON_VISUAL / spec_created 境界チェック
  - 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）判定

## 必須運用ルール

- root `artifacts.json` と `outputs/phase-12/` 配下に置く artifacts.json（必要時）の **parity** を必ずチェックする
- workflow_state は `spec_created` のまま据え置く。本 Phase では `completed` に書き換えない
- spec_created 段階のため、上記成果物は「実装完了証跡」ではなく「後続実装 issue が埋めるべき章構成と判定基準」を記録する

## 多角的チェック観点

- 不変条件 #1: schema 固定禁止が中学生レベル説明にも反映されているか
- 不変条件 #5: 「D1 直接アクセスは apps/api のみ」が Part 2 の DDL/repository 章に明記されているか
- 不変条件 #14: alias 集約点が /admin/schema 周辺に保たれることを system-spec-update-summary.md で確認

## サブタスク管理

- [x] `outputs/phase-12/implementation-guide.md`（章構成 completed evidence）
- [x] `outputs/phase-12/system-spec-update-summary.md`（Step 1-A〜1-C の見出しのみ）
- [x] `outputs/phase-12/documentation-changelog.md`（変更ファイル一覧）
- [x] `outputs/phase-12/unassigned-task-detection.md`（候補 A/B/C 列挙）
- [x] `outputs/phase-12/skill-feedback-report.md`（学び 2 件 + 改善提案有無）
- [x] root `artifacts.json` parity チェック実施
- [x] workflow_state が `spec_created` のままであることを確認

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実行タスク

- [x] 本 Phase の目的に対応する仕様判断を本文に固定する
- [x] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [x] 次 Phase が参照する入力と出力を明記する

## 参照資料

- 依存 Phase: Phase 2 / Phase 5 / Phase 6 / Phase 8 / Phase 9 / Phase 10 / Phase 11
- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [x] 5 タスク分 + compliance check のファイルが章構成付きで揃っている
- [x] workflow_state が `spec_created` で据え置かれている
- [x] artifacts.json parity が崩れていない
- [x] CLOSED issue #191 への補完仕様であることが implementation-guide / changelog の双方に記述されている

## タスク100%実行確認

- [x] 7 ファイル全てがアーティファクトとして列挙されている
- [x] Part 1（中学生レベル）と Part 2（技術者レベル）の両章が implementation-guide に存在
- [x] system-spec-update-summary が Step 1-A〜1-D と Step 2 再判定を持つ
- [x] unassigned-task-detection が 0 件でも出力されている
- [x] skill-feedback-report が 0 件改善でも出力されている

## 次 Phase への引き渡し

Phase 13（PR 作成）では、本 Phase 産出の 5 ファイルを「補完仕様化に伴う docs 更新」として PR body の `## 含む変更` に列挙する。
